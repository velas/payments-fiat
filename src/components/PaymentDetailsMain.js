import React, { useState, useEffect } from "react";
import { Provider } from "./ProviderSelection.js";
import UtorgPaymentDetails from "./Utorg/PaymentDetails.js";
import SimplexPaymentDetails from "./Simplex/PaymentDetails.js";
import TransakPaymentDetails from "./Transak/PaymentDetails.js";
import Checkout from "./Utorg/Checkout.js";
import TransakCheckout from "./Transak/Checkout.js";
import SimplexCheckout from "./Simplex/Checkout.js";
import queryString from "query-string";
import {
  TICKER_URL,
  UTORG_DOMAIN,
  UTORG_CONVERT_URL,
  TICKER_URL_FIXER,
} from "../utils/constants.js";
import Swal from "sweetalert2";
import axios from "axios";
import EmptyView from "./EmptyView.js";

const PaymentDetailsMain = (props) => {
  const [pageIsLoading, setPageIsLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [referrer, setReferrer] = useState(document.referrer);
  const parsed = queryString.parse(global.location.search);
  const [tickerData, setTickerData] = useState({});
  const [tickerFiatData, setTickerFiatData] = useState({});
  const [minAmount, setMinAmount] = useState(0);
  const [currentRate, setCurrentRate] = useState(null); //currentRate means 1 fiat to crypto
  const _currentRate = 1 / (currentRate / 100);
  const [showProvider, setShowProvider] = useState(false);
  // console.log('showProvider',showProvider)
  // console.log('selectedProvider',selectedProvider)
  // console.log('currentRate',currentRate)
  useEffect(() => {
    if (
      // currentRate &&
      Object.keys(tickerData).length > 0 &&
      Object.keys(tickerFiatData).length > 0
    ) {
      const timer = setTimeout(() => {
        setShowProvider(true);
      }, 40);
  
      return () => clearTimeout(timer);
    }
  }, [tickerData, tickerFiatData, selectedProvider]); //add currentRate

  const DEFAULT_RECEIVE_CRYPTO_AMOUNT = parsed.amount ? parsed.amount : 300;

  useEffect(() => {
    sessionStorage.removeItem("loaded");
    sessionStorage.setItem("min_amount", DEFAULT_RECEIVE_CRYPTO_AMOUNT);
  }, true);

  // console.log("parsed.amount", parsed.amount);
  const network = parsed.env
    ? parsed.env === "wallet_testnet"
      ? "testnet"
      : "mainnet"
    : "mainnet";

  const makeQuery = async ({ url, params, forceMainnet }) => {
    const seed =
      network === "testnet" && !forceMainnet ? "Fhg5x79TFf" : "VelasWallet";
    const headers = {
      "Content-Type": "application/json;charset=UTF-8",
      "X-AUTH-SID": seed,
      "X-AUTH-NONCE": Date.now(),
    };
    const _network = forceMainnet ? "mainnet" : network;
    const domain = UTORG_DOMAIN[`${_network}`];
    const _params = !params ? {} : params;

    const quoteResult = await axios.post(`${domain}/${url}`, _params, {
      headers,
    });
    return quoteResult;
  };

  const currs = {
    VLX_NATIVE: "VLX",
    VLX_EVM: "VLXETH",
  };
  const _currs = currs[parsed.crypto_currency] || "VLXETH";

  const fetchData = async () => {
    //VLX
    try {
      const result = await fetch(TICKER_URL);
      const rates = await result.json();

      setTickerData(rates);
    } catch (err) {
      setPageIsLoading(false);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        html: `<p className="info-style">Sorry, unexpected error occurred. ${err}`,
      });
    }

    //FIXER
    try {
      const fiatData = await fetch(TICKER_URL_FIXER);
      const result_eur = await fiatData.json();
      setTickerFiatData(result_eur);
    } catch (err) {
      setPageIsLoading(false);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        html: `<p className="info-style">Sorry, unexpected error occurred. ${err}`,
      });
    }

    // currentRate and minAmount

    // uncomment when Utorg will restore our account👇👇👇!!

      // try {
      //   const currencyResult = await makeQuery({
      //     url: "api/merchant/v1/settings/currency",
      //   });
      //   if (currencyResult && currencyResult.data && currencyResult.data.data) {
      //     const data = currencyResult.data.data;
      //     const currData = {};
      //     data.forEach((it) => {
      //       currData[it.currency] = { min: it.depositMin, max: it.depositMax };
      //     });
  
      //     if (currData["USD"]) {
      //       const { min, max } = currData["USD"];
      //       setMinAmount(min);
      //     }
      //   }
      // } catch (err) {
      //   setPageIsLoading(false);
      //   Swal.fire({
      //     icon: "error",
      //     title: "Oops...",
      //     html: `<p className="info-style">Sorry, unexpected error occurred. ${err}`,
      //   });
      // }
  
      // try {
      //   const convertParams = {
      //     fromCurrency: "USD",
      //     toCurrency: _currs,
      //     paymentAmount: 100,
      //   };
  
      //   const convertResult = await makeQuery({
      //     url: UTORG_CONVERT_URL,
      //     params: convertParams,
      //     forceMainnet: true,
      //   });
      //   if (convertResult && convertResult.data && convertResult.data.data) {
      //     setCurrentRate(convertResult.data.data);
      //   }
      // } catch (err) {
      //   setPageIsLoading(false);
      //   Swal.fire({
      //     icon: "error",
      //     title: "Oops...",
      //     html: `<p className="info-style">Sorry, unexpected error occurred. ${err}`,
      //   });
      // }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const crypto_usd_rate = tickerData["price_usd"];
  const minimalAmounts = {
    simplex: 50,
    transak: 31 * (tickerFiatData["USD"] || 1),
  };
  const MIN_AMOUNT_USD = minimalAmounts[selectedProvider];
  useEffect(() => {
    if (hasUrlProvider) {
      const provider_ = (global.location.pathname || "").split("/provider/")[1];
      const provider = provider_.replace(/\/+$/g, "");
      setSelectedProvider(provider);
    }
  }, []);

  const hasUrlProvider =
    global &&
    global.location &&
    global.location.pathname &&
    (global.location.pathname || "").split("/provider/").length > 1;

  var location = window.location.href;
  const hasUtorgUrlCheckout =
    (props.history.location.state &&
      props.history.location.state.step === "WAIT_FOR_POSTBACK") ||
    global.location.pathname === "/provider/utorg/checkout";
  const hasTransakUrlCheckout =
    location.indexOf("/provider/transak/checkout") > -1;
  const hasSimplexUrlCheckout =
    location.indexOf("/provider/simplex/checkout") > -1;

  if (
    Object.keys(tickerData).length === 0 ||
    Object.keys(tickerFiatData).length === 0
  )
    return <EmptyView pageIsLoading={pageIsLoading} />;

  return (
    <>
      {hasUtorgUrlCheckout || hasTransakUrlCheckout || hasSimplexUrlCheckout ? (
        <>
          {hasUtorgUrlCheckout && (
            <Checkout selectedProvider={selectedProvider} {...props} />
          )}
          {hasTransakUrlCheckout && <TransakCheckout {...props} />}
          {hasSimplexUrlCheckout && <SimplexCheckout {...props} />}
        </>
      ) : (
        <>
          {!hasUrlProvider && showProvider && (
            <div
              className="col-md-10 offset-md-1 common-provider-selection"
              style={{ zIndex: 2,  marginTop: 35 }}
            >
              <Provider
                selectedProvider={selectedProvider}
                setSelectedProvider={setSelectedProvider}
                {...props}
              />
            </div>
          )}

          {/* by default for rate display, start*/}
          {!selectedProvider && (
            <TransakPaymentDetails
            selectedProvider={selectedProvider}
            defaultAmount={
              sessionStorage.getItem("min_amount") <
              MIN_AMOUNT_USD / crypto_usd_rate
                ? MIN_AMOUNT_USD / crypto_usd_rate
                : sessionStorage.getItem("min_amount") || parsed.amount || 0
            }
            {...props}
          />
          )}
          {/* by default for rate display, end*/}

          {/* // uncomment when Utorg will restore our account👇👇👇!! */}

          {/* {selectedProvider === "utorg" && (
            <UtorgPaymentDetails
              selectedProvider={selectedProvider}
              redirectTo={props.history.push}
              referrer={referrer}
              defaultAmount={
                sessionStorage.getItem("min_amount") < minAmount / _currentRate
                  ? minAmount / _currentRate
                  : sessionStorage.getItem("min_amount") || parsed.amount || 0
              }
              {...props}
            />
          )} */}

          {/* {selectedProvider === "simplex" && (
            <SimplexPaymentDetails
              selectedProvider={selectedProvider}
              defaultAmount={
                sessionStorage.getItem("min_amount") <
                MIN_AMOUNT_USD / crypto_usd_rate
                  ? MIN_AMOUNT_USD / crypto_usd_rate
                  : sessionStorage.getItem("min_amount") || parsed.amount || 0
              }
              {...props}
            />
          )} */}

          {selectedProvider === "transak" && (
            <TransakPaymentDetails
              selectedProvider={selectedProvider}
              defaultAmount={
                sessionStorage.getItem("min_amount") <
                MIN_AMOUNT_USD / crypto_usd_rate
                  ? MIN_AMOUNT_USD / crypto_usd_rate
                  : sessionStorage.getItem("min_amount") || parsed.amount || 0
              }
              {...props}
            />
          )}
        </>
      )}
    </>
  );
};

export default PaymentDetailsMain;
