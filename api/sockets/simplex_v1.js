const { SIMPLEX_API, SIMPLEX_API_KEY } = require('../consts');

const QUERY_EVENTS_DELAY_MS = 1000;

const listeningPayments = new Map();

async function queryEvents() {
  try {
    if (!listeningPayments) return;
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `ApiKey ${SIMPLEX_API_KEY}`
    };
    const fetchOpts = {
      method: 'get',
      headers
    };
    const fetchResponse = await fetch(`${SIMPLEX_API}/wallet/merchant/v2/events`, fetchOpts);
    const { events } = fetchResponse;
    for (let event of events) {
      if (!listeningPayments.has(event?.payment?.id)) continue;
      try {
        await listeningPayments.get(event?.payment?.id)(event);
      } catch (e) {
        console.error('Error processing event', e);
      }
    }
  } catch(e) {
    console.error(e);
  } finally {
    setTimeout(queryEvents, QUERY_EVENTS_DELAY_MS);
  }
}

module.exports.init = (io) => {
  io.on('connection', (socket) => {
    if (socket.handshake.query !== 'v1/simplex/status' || !socket.handshake.payment_id) return;
    listeningPayments.set(socket.handshake.payment_id, (event) => processEvent(socket, event));
  });
  
};