const express = require('express');
const fetch = require('node-fetch');
const { SIMPLEX_API, SIMPLEX_API_KEY } = require('../consts');
const { v4: uuidv4 } = require('uuid');

const apiv1 = express.Router();
const SUPPORTED_CRYPTO_CURRENCIES = ['BTC', 'ETH', 'VLX', 'VLX-EVM'];
const SUPPORTED_FIAT_CURRENCIES = ['USD', 'EUR'];

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

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
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
    const simplexResponseText = await fetchResponse.text();
    let simplexResponse;
    try {
      simplexResponse = JSON.parse(simplexResponseText);
    } catch (e) {
      console.error(simplexResponseText);
      throw e;
    }
    if (simplexResponse.error) throw new Error(simplexResponse.error);
    const returnValue = {
      quote_id: simplexResponse.quote_id,
      digital_money: simplexResponse.digital_money,
      fiat_money: simplexResponse.fiat_money,
      valid_until: simplexResponse.valid_until,
      error: simplexResponse.error,
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

apiv1.post('/payment', async (req, res) => {
  try {
    const { quote_id, address, payment_id, crypto_currency, debug } = req.body;
    const order_id = uuidv4();
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
    const fetchBody = {
      "account_details": {
        "app_provider_id": "velas",
        "app_version_id": process.version,
        "app_end_user_id": address,
        "signup_login": {
          "ip": ip,
          "accept_language": req.headers["accept-language"],
          "http_accept_language": req.headers["accept-language"],
          "user_agent": req.get('User-Agent'),
          "timestamp": new Date().toISOString()
        }
      },
      "transaction_details": {
        "payment_details": {
                "quote_id": quote_id,
                "payment_id": payment_id,
                "order_id": order_id,
                "destination_wallet": {
                    "currency": crypto_currency,
                    "address": address,
                    "tag": ""
                },
                "original_http_ref_url": req.get('Referrer')
            }
      }
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
    const fetchResponse = await fetch(`${SIMPLEX_API}/wallet/merchant/v2/payments/partner/data`, fetchOpts);
    const responseText = await fetchResponse.text();
    try {
      res.json(JSON.parse(responseText)).end();
    } catch (e) {
      console.error(responseText);
      throw e;
    }
  } catch(e) {
    console.error(e);
    res.status(500).send(e.message);
  }
});

module.exports = apiv1;
