const express = require('express');
const fetch = require('node-fetch');
const { SIMPLEX_API, SIMPLEX_API_KEY } = require('../consts');

const apiv1 = express.Router();
const SUPPORTED_CRYPTO_CURRENCIES = ['BTC', 'ETH', 'VLX'];
const SUPPORTED_FIAT_CURRENCIES = ['USD'];

apiv1.post('/quote', async (req, res) => {
  try {
    const { crypto_currency, fiat_currency, crypto_amount, address, debug } = req.body;
    if (!crypto_currency) {
      throw new Error('crypto_currency required');
    }
    if (!fiat_currency) {
      throw new Error('fiat_currency required');
    }
    if (!crypto_amount || typeof crypto_amount !== 'number' || crypto_amount <= 0) {
      throw new Error('crypto_amount number required');
    }
    if (!SUPPORTED_CRYPTO_CURRENCIES.includes(crypto_currency)) {
      throw new Error('crypto_currency unsupported');
    }
    if (!SUPPORTED_FIAT_CURRENCIES.includes(fiat_currency)) {
      throw new Error('fiat_currency unsupported');
    }

    var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress 
    const fetchBody = {
      "end_user_id": address,
      "digital_currency": crypto_currency,
      "fiat_currency": fiat_currency,
      "requested_currency": crypto_currency,
      "requested_amount": crypto_amount,
      "wallet_id": 'velas',
      "client_ip": ip,
      "payment_methods" : ["credit_card"] 
    };

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `ApiKey ${SIMPLEX_API_KEY}`
    };
    const fetchOpts = {
      method: 'post',
      body: JSON.stringify(fetchBody),
      headers
    };
    const fetchResponse = await fetch(`${SIMPLEX_API}/wallet/merchant/v2/quote`, fetchOpts);
    const simplexResponse = await fetchResponse.json();

    const returnValue = {
      quote_id: simplexResponse.quote_id,
      digital_money: simplexResponse.digital_money,
      fiat_money: simplexResponse.fiat_money,
      valid_until: simplexResponse.valid_until,
    };
    if (debug) {
      returnValue.ip = ip;
    }
    res.json(returnValue).end();
  } catch(e) {
    console.error(e);
    res.status(500).send(e.message);
  }
});

apiv1.post('/payment', function(req, res) {
});

module.exports = apiv1;
