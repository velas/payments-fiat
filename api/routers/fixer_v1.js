const express = require('express');
const fetch = require('node-fetch');
const { FIXER_API_KEY, FIXER_UPDATE_INTERVAL } = require('../consts');

const apiv1 = express.Router();
let latestRates = null;
let ratesTs = null;

async function updateRates() {
  if (!FIXER_API_KEY) return;
  const res = await fetch(`http://data.fixer.io/api/latest?access_key=${FIXER_API_KEY}`);
  const json = await res.json();
  if (!json.rates || !json.rates.USD) {
    console.error('Invalid fixer response', json);
    throw new Error('Invalid fixer response');
  }
  ratesTs = json.timestamp;
  latestRates = json.rates;
}

async function updateRatesAutorun() {
  try {
    await updateRates();
  } catch(e) {
    console.error('updateRates', e);
  } finally {
    setTimeout(updateRatesAutorun, FIXER_UPDATE_INTERVAL);
  }
}

apiv1.get('/', async (req, res) => {
  res.json(latestRates).end();
});

updateRatesAutorun();

module.exports = apiv1;
