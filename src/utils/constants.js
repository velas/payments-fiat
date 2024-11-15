export const BASE_API_URL = '/api/v1/simplex';
export const TICKER_URL = 'https://explorer.velas.com/ticker'; // https://evmexplorer.velas.com/ticker
export const TICKER_URL_FIXER = 'https://buy.velas.com/api/v1/rates';
export const UTORG_CONVERT_URL = 'api/merchant/v1/tools/convert';

export const REDIRECT_URIS = {
  wallet_mainnet: 'https://wallet.velas.com/',
  wallet_testnet: 'https://wallet.testnet.velas.com/',
}

export const SIMPLEX_PAYMENT_URIS = {
  testnet: 'https://sandbox.test-simplexcc.com/payments/new',
  mainnet: 'https://checkout.simplexcc.com/payments/new',
}

export const SIMPLEX_DOMAIN = {
  testnet: 'https://sandbox.test-simplexcc.com',
  mainnet: 'https://checkout.simplexcc.com',
}

export const UTORG_DOMAIN = {
  testnet: 'https://app-stage.utorg.pro',
  mainnet: 'https://app.utorg.pro',
}

export const UTORG_TX_DETAILS_URI = "api/merchant/v1/order/find";

export const UTORG_PAYMENT_URIS = {
  testnet: 'api/merchant/v1/order/init',
  mainnet: 'api/merchant/v1/order/init',
}

export const TRANSAK_API_KEY = {
  mainnet: '72a39429-d0d4-48d4-942a-f80dc9deed57',
  testnet: 'ed24950e-bde8-44b0-b328-e918d1c1ccb0',
}

export const TRANSAK_DOMAIN = {
  mainnet: 'https://global.transak.com',
  testnet: 'https://staging-global.transak.com',
}

export const TRANSAK_REDIRECT_URIS = {
  mainnet: 'https://buy.velas.com/provider/transak/checkout',
  testnet: 'https://fiat-payments.testnet.velas.com/provider/transak/checkout',
}
