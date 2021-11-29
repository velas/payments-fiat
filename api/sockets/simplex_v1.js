const fetch = require('node-fetch');
const { SIMPLEX_API, SIMPLEX_API_KEY } = require('../consts');

const QUERY_EVENTS_DELAY_MS = 1000;
const REMOVE_EVENTS_OLDER_MS = 24*3600*1000;

const listeningPayments = new Map();

async function queryEvents() {
  try {
    if (listeningPayments.size === 0) return;
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `ApiKey ${SIMPLEX_API_KEY}`
    };
    const fetchOpts = {
      method: 'get',
      headers
    };
    const fetchResponse = await fetch(`${SIMPLEX_API}/wallet/merchant/v2/events`, fetchOpts);
    const eventsJson = await fetchResponse.json();
    const { events } = eventsJson;
    for (let event of events) {
      if (!listeningPayments.has(event?.payment?.id)) continue;
      try {
        await listeningPayments.get(event?.payment?.id)(event);
      } catch (e) {
        console.error('Error processing event', e);
      }
    }
    await cleanOldEvents(events);
  } catch(e) {
    console.error(e);
  } finally {
    setTimeout(queryEvents, QUERY_EVENTS_DELAY_MS);
  }
}

async function processEvent(socket, event) {
  socket.emit('update', event);
}

async function onEventProcessed(socket, args) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `ApiKey ${SIMPLEX_API_KEY}`
  };
  const fetchOpts = {
    method: 'delete',
    headers
  };
  await fetch(`${SIMPLEX_API}/wallet/merchant/v2/events/${encodeURIComponent(args.event_id)}`, fetchOpts);
}

async function cleanOldEvents(events) {
  for (let event of events) {
    if (Date.now() - new Date(event.timestamp) <= REMOVE_EVENTS_OLDER_MS) continue;
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `ApiKey ${SIMPLEX_API_KEY}`
    };
    const fetchOpts = {
      method: 'delete',
      headers
    };
    await fetch(`${SIMPLEX_API}/wallet/merchant/v2/events/${encodeURIComponent(event.event_id)}`, fetchOpts);
  }
}

module.exports.init = (io) => {
  io.on('connection', (socket) => {
    if (socket.handshake.query.query !== 'v1/simplex/status' || !socket.handshake.query.payment_id) return;
    listeningPayments.set(socket.handshake.query.payment_id, (event) => processEvent(socket, event));
    socket.on("disconnect", () => {
      listeningPayments.delete(socket.handshake.query.payment_id);
    });
    socket.on("processed", (args) => onEventProcessed(socket, args))
  });
  void queryEvents();
};