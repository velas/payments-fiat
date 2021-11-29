# payments-fiat

Receive fiat payments service

Use PORT env variable to select listening port. `3000` by default.


Use node version 15. 


Install deps `yarn`. 


Run `yarn start`.

Application which uses this service must build URL to receive fiat payment and convert it to crypto.

Example: /simplex/2?address=DAWxo9UT6jCfCWZSoJGaU14Fjjr5boCKyNe8J6SWmcTC&crypto_currncy=VLX&env=wallet_mainnet
