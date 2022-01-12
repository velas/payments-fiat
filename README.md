# payments-fiat

Receive fiat payments service

It uses 3000 port to listen to incomming http connections.

It is configured for sandbox environment by default. For production use, declare SIMPLEX_API and SIMPLEX_API_KEY environment variables.

Use node version 15.


Install deps `yarn`.


Run `yarn start`.

Application which uses this service must build URL to receive fiat payment and convert it to crypto.

Example: /?address=DAWxo9UT6jCfCWZSoJGaU14Fjjr5boCKyNe8J6SWmcTC&crypto_currency=VLX&env=wallet_mainnet

For fiat rates api to work (/api/v1/rates) you need to provide FIXER_API_KEY environment variable. Go to https://fixer.io/ to get this key.

You can provide FIXER_UPDATE_INTERVAL for fixer update interval in miliseconds. It is 24h by default.
