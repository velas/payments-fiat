import axios from "axios";
import {
  UTORG_PAYMENT_URIS,
  UTORG_CONVERT_URL,
  UTORG_DOMAIN,
  TICKER_URL,
  TICKER_URL_FIXER,
} from "../../utils/constants";

export const makeQuery = async ({ url, params, network, forceMainnet }) => {
  const seed =
    network === 'testnet' && !forceMainnet ? 'Fhg5x79TFf' : 'VelasWallet';
  const headers = {
    'Content-Type': 'application/json;charset=UTF-8',
    'X-AUTH-SID': seed,
    'X-AUTH-NONCE': Date.now(),
  };
  const _network = forceMainnet ? "mainnet" : network;
  const domain  = UTORG_DOMAIN[`${_network}`];
  const _params = !params ? {} : params;

  const quoteResult = await axios.post(`${domain}/${url}`, _params, { headers });
  return quoteResult;
}