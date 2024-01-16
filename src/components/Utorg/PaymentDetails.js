import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Form,
  Button,
  InputGroup,
  FormControl,
  DropdownButton,
  Dropdown,
} from "react-bootstrap";
import axios from "axios";
import {
  UTORG_PAYMENT_URIS,
  UTORG_CONVERT_URL,
  UTORG_DOMAIN,
  TICKER_URL,
  TICKER_URL_FIXER,
} from "../../utils/constants";
import queryString from "query-string";
import { v4 as uuidv4 } from "uuid";
import Swal from "sweetalert2";
import EmptyView from "../EmptyView";
import { isValidAddress } from "../../utils/address-validation";
import { title_info, body_utorg } from "../InfoMsg";
import { isAndroid, isIOS } from "react-device-detect";
import { toFixed } from "../../utils/format-value";
import CurrencyIcon from "../CurrencyIcon";

const PARTNER_NAME = "velas";
const VELAS_WALLET_DOMAIN = "https://wallet.velas.com/";
const DEFAULT_MIN_AMOUNT_USD = 50;
const DEFAULT_MAX_AMOUNT_USD = 20000;
// const DEFAULT_RECEIVE_CRYPTO_AMOUNT = 300;
const SUPPORTED_CURRENCIES = [
  "AUD",
  "BRL",
  "CAD",
  "CZK",
  "DKK",
  "EUR",
  "GBP",
  "KZT",
  "NOK",
  "NZD",
  "PLN",
  "SEK",
  "UAH",
  "USD",
];

const CRYPTO_CURRENCIES_kv = {
  vlx: "EVM",
  vlx_native: "NATIVE",
};

const parsed = queryString.parse(global.location.search);
// console.log("global.location.search",global.location.search)
const ALL_REQUIRED_PARAMS_MISSED =
  !parsed.address && !parsed.crypto_currency && !parsed.env;
const network = parsed.env
  ? parsed.env === "wallet_testnet"
    ? "testnet"
    : "mainnet"
  : "mainnet";

///default crypto validation for old and latest version of mobile wallet
const OLD_PARAMETER_CRYPTO = "VLX";
const valid_mobile =
  (parsed.address &&
    parsed.crypto_currency === OLD_PARAMETER_CRYPTO &&
    isIOS) ||
  isAndroid;
let valid_address_evm = queryString.parse(parsed.address);
const stringified_valid = queryString.stringify(valid_address_evm);
valid_address_evm = stringified_valid.substr(0, 2);
const valid_mobile_parameters =
  valid_address_evm === "0x" ? "vlx" : "vlx_native";
const DEFAULT_CRYPTO_CURRENCY = valid_mobile
  ? valid_mobile_parameters
  : parsed.crypto_currency &&
    CRYPTO_CURRENCIES_kv[`${parsed.crypto_currency.toLowerCase()}`]
  ? parsed.crypto_currency.toLowerCase()
  : "vlx";
///

// const DEFAULT_CRYPTO_CURRENCY = parsed.crypto_currency && CRYPTO_CURRENCIES_kv[`${(parsed.crypto_currency).toLowerCase()}`] ? (parsed.crypto_currency).toLowerCase() : 'vlx';

const domain = UTORG_DOMAIN[`${network}`];

const CurrencyRow = ({
  onChangeAmount,
  amount,
  placeholder,
  label,
  selectedRow,
  setSelectedRow,
  currencies,
  cryptoCurrencies,
  disabled,
  disabledItem,
}) => {
  const cryptos = cryptoCurrencies ? Object.keys(cryptoCurrencies) : [];
  return (
    <>
      <Form.Label className="left-side-p">{label}</Form.Label>
      <InputGroup>
        <FormControl
          value={amount}
          onChange={onChangeAmount}
          placeholder={placeholder}
          type="number"
          className="amount-form-control"
        />
        <DropdownButton
          title={
            <div className="dropdown-row">
              <CurrencyIcon
                currencyCode={selectedRow}
                className="icon-currency-dropdown"
              />
              <span>{selectedRow}</span>
              <svg
                height="20"
                width="20"
                viewBox="0 0 20 20"
                aria-hidden="true"
                focusable="false"
                className="css-tj5bde-Svg"
                style={{ marginTop: -3, marginLeft: 3 }}
              >
                <path d="M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z"></path>
              </svg>
            </div>
          }
          id="dropdown-fiat"
          disabled={disabled}
        >
          {(currencies || []).map((it) => {
            return (
              <Dropdown.Item
                key={it}
                style={{ fontSize: 12 }}
                href="#"
                active={selectedRow === it}
                onSelect={() => setSelectedRow(it)}
              >
                <div className="dropdown-row">
                  <CurrencyIcon
                    currencyCode={it}
                    className="icon-currency-dropdown"
                  />
                  {it}
                </div>
              </Dropdown.Item>
            );
          })}
          {(cryptos || []).map((it) => {
            const name = CRYPTO_CURRENCIES_kv[`${it}`];
            return (
              <Dropdown.Item
                key={name}
                style={{ fontSize: 12 }}
                href="#"
                active={selectedRow === name}
                onSelect={() => setSelectedRow(it)}
              >
                <div className="dropdown-row">
                  <CurrencyIcon
                    currencyCode={name}
                    className="icon-currency-dropdown"
                  />
                  {name}
                </div>
              </Dropdown.Item>
            );
          })}
        </DropdownButton>
      </InputGroup>
    </>
  );
};
const PaymentDetails = (props) => {
  const DEFAULT_RECEIVE_CRYPTO_AMOUNT = props.defaultAmount;

  //console.log("Utorg [PaymentDetails] props", props);
  const payment_id = useMemo(uuidv4, []);
  const checkout_url = `${
    global.location.origin
  }/provider/checkout/${encodeURIComponent(payment_id)}/${encodeURIComponent(
    network
  )}`;
  const [tickerData, setTickerData] = useState({});
  const [tickerFiatData, setTickerFiatData] = useState({});
  const [currencyData, setCurrencyData] = useState({});
  const [minAmount, setMinAmount] = useState(0);
  const [maxAmount, setMaxAmount] = useState(0);
  const [amountInFromCurrency, setAmountInFromCurrency] = React.useState(true);

  const [amount, setAmount] = useState(DEFAULT_RECEIVE_CRYPTO_AMOUNT);
  const [amountFrom, setAmountFrom] = useState(0);
  const [amountTo, setAmountTo] = useState(0);
  const [address, setAddress] = useState("");
  const [selectedFiat, setSelectedFiat] = useState("USD");
  const [pageIsLoading, setPageIsLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedCryptoCurrency, setSelectedCryptoCurrency] = useState(
    DEFAULT_CRYPTO_CURRENCY
  );
  const [currentRate, setCurrentRate] = useState(null); //currentRate means 1 fiat to crypto

  const hasUrlProvider =
    global &&
    global.location &&
    global.location.pathname &&
    (global.location.pathname || "").split("/provider/").length > 1;

  async function fetchCryptoRate(params) {
    const currs = {
      vlx_native: "VLX",
      vlx: "VLXETH",
    };
    const from_currency = params && params.fiat ? params.fiat : selectedFiat;
    const to_currency =
      params && params.cryptoCurrency
        ? currs[`${params.cryptoCurrency}`]
        : currs[`${selectedCryptoCurrency}`];

    //FETCH UTORG RATES
    try {
      const convertParams = {
        fromCurrency: from_currency,
        toCurrency: to_currency,
        paymentAmount: 100,
      };

      const convertResult = await makeQuery({
        url: UTORG_CONVERT_URL,
        params: convertParams,
        forceMainnet: true,
      });
      if (convertResult && convertResult.data && convertResult.data.data) {
        setCurrentRate(convertResult.data.data);
        // console.log("convertResult.data.data", convertResult.data.data);
      }
    } catch (err) {
      setPageIsLoading(false);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        html: `<p className="info-style">Sorry, unexpected error occurred. ${err}`,
      });
    }
  }

  async function fetchData() {
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

    await fetchCryptoRate();

    //Fiat
    try {
      const fiatData = await fetch(TICKER_URL_FIXER);
      setTickerFiatData(await fiatData.json());
    } catch (err) {
      setPageIsLoading(false);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        html: `<p className="info-style">Sorry, unexpected error occurred. ${err}`,
      });
    }

    try {
      const currencyResult = await makeQuery({
        url: "api/merchant/v1/settings/currency",
      });
      if (currencyResult && currencyResult.data && currencyResult.data.data) {
        const data = currencyResult.data.data;
        const currData = {};
        data.forEach((it) => {
          currData[it.currency] = { min: it.depositMin, max: it.depositMax };
        });
        setCurrencyData(currData);

        if (currData[`${selectedFiat}`]) {
          const { min, max } = currData[`${selectedFiat}`];
          setMinAmount(min);
          setMaxAmount(max);
        }
      }
    } catch (err) {
      setPageIsLoading(false);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        html: `<p className="info-style">Sorry, unexpected error occurred. ${err}`,
      });
    }
    setPageIsLoading(false);
  }

  useEffect(() => {
    if (parsed.address) {
      setAddress(parsed.address);
    }
    if (props.selectedProvider) {
      setSelectedProvider(props.selectedProvider);
    } else {
      const pathsName = hasUrlProvider
        ? (global.location.pathname.split("/provider/")[1] || "").split("/")
        : [];

      if (pathsName[0]) {
        setSelectedProvider(pathsName[0]);
      }
    }
    fetchData();

    //cleanup
    localStorage.removeItem("storageProvider");
  }, []);

  const handleChange = (e) => {
    setAddress(e.target.value);
  };

  const handleSelectFiat = async (fiat) => {
    setSelectedFiat(fiat);
    await fetchCryptoRate({ fiat });
    const chosenCurrencyData = currencyData[`${fiat}`];
    if (!chosenCurrencyData)
      return console.error(`${fiat} was not found in currencyData object.`);
    const { min, max } = chosenCurrencyData;
    setMinAmount(min);
    setMaxAmount(max);
  };

  let valid_address_evm = queryString.parse(parsed.address || address);
  const stringified_valid = queryString.stringify(valid_address_evm);
  valid_address_evm = stringified_valid.substr(0, 2);

  const crypto_currency = (
    parsed.crypto_currency ||
    selectedCryptoCurrency ||
    ""
  ).toLowerCase();
  const displayCryptoCurrency =
    CRYPTO_CURRENCIES_kv[`${selectedCryptoCurrency}`];

  let toAmount, fromAmount;
  let amountLessThanMin = false;
  let amountMoreThanMax = false;

  const toUsd = (amount) => {
    return amount / (tickerFiatData["USD"] || 1);
  };

  if (currentRate && tickerFiatData) {
    const usd_amount_of_1_Euro = tickerFiatData["USD"];
    const fiatRate = tickerFiatData[selectedFiat]; // cost selectedCryptoCurrency currency in eur
    const cryptoPriceKey =
      ["vlx", "vlx_native"].indexOf(crypto_currency) > -1
        ? "price_usd"
        : `${crypto_currency}_price`;

    //const crypto_usd_rate = tickerData[cryptoPriceKey] || 1;
    //const crypto_fiat_rate = crypto_usd_rate * toUsd(fiatRate);
    //console.log({crypto_usd_rate, crypto_fiat_rate, fiatRate})
    //const FIAT_PER_CRYPTO = selectedFiat === "EUR" ? toUsd(crypto_usd_rate) : crypto_fiat_rate;
    // const FIAT_PER_CRYPTO = 1 / currentRate;
    const FIAT_PER_CRYPTO = 1 / (currentRate / 100);

    if (amountInFromCurrency) {
      //Receive input
      toAmount = amount;
      fromAmount = (FIAT_PER_CRYPTO * amount).toFixed(2);
    } else {
      // Pay Input
      const amountReceive = (amountFrom / FIAT_PER_CRYPTO).toFixed(2);
      fromAmount = amountFrom;
      toAmount = amountReceive;
    }

    amountLessThanMin = fromAmount < minAmount;
    amountMoreThanMax = fromAmount > maxAmount;
    sessionStorage.setItem("min_amount", Number(toAmount));
  }

  const handleFromAmountChange = (e) => {
    if (e.target.value < 0) return;
    setAmountFrom(e.target.value);
    setAmountInFromCurrency(false);
    setAmountTo(true);
  };

  const handleToAmountChange = (e) => {
    if (e.target.value < 0) return;
    setAmount(e.target.value);
    setAmountInFromCurrency(true);
    setAmountTo(false);
  };

  const formRef = useRef(null);

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

  const newUrlParams = () => {
    const checkCurrency = {
      vlx_native: "VLX_NATIVE",
      vlx: "VLX_EVM",
    };
    const params = new URLSearchParams(global.location.search);
    params.set("address", address || parsed.address);
    params.set("crypto_currency", checkCurrency[`${selectedCryptoCurrency}`]);
    params.set("amount", toAmount);
    window.history.replaceState(
      {},
      "",
      `${global.location.pathname}?${params}`
    );
  };

  const onSubmitUtorg = async (e) => {
    e.preventDefault();
    const paymentCurrency = (
      selectedFiat || parsed.fiat_currency
    ).toUpperCase();
    const paymentUrl = UTORG_PAYMENT_URIS[`${network}`];
    const _address = parsed.address || address;
    const env = parsed.env || "wallet_mainnet";
    const currs = {
      vlx_native: "VLX",
      vlx: "VLXETH",
    };
    const currency = currs[selectedCryptoCurrency];
    if (!currency) {
      return Swal.fire({
        icon: "error",
        title: "Oops...",
        html: "Unknown crypto currency was chosen to receive",
      });
    }
    const checkout_url = `${
      global.location.origin
    }/provider/utorg/checkout?payment_id=${encodeURIComponent(
      payment_id
    )}&env=${encodeURIComponent(env)}`;
    const postbackUrl = `${
      global.location.origin
    }/utorg/quote/${encodeURIComponent(payment_id)}`;
    const referredFromLocalHost =
      props.referrer &&
      props.referrer.length > 0 &&
      (props.referrer.indexOf("://127.0.0.1") > -1 ||
        props.referrer.indexOf("://localhost") > -1);
    const referrerUrl = referredFromLocalHost
      ? `${props.referrer}main-index.html`
      : props.referrer;
    const referrerIsEmpty = referrerUrl.length === 0;
    const successUrl = referrerIsEmpty
      ? `${global.location.origin}/provider/utorg`
      : referrerUrl;
    const _checkCurrency = {
      VLX: "VLX_NATIVE",
      VLXETH: "VLX_EVM",
    };
    const failUrl = `${
      global.location.origin
    }/?address=${_address}&amount=${toAmount}&crypto_currency=${
      _checkCurrency[`${currency}`]
    }`;
    //debugger;
    const params = {
      type: "FIAT_TO_CRYPTO",
      currency: currency,
      paymentCurrency: paymentCurrency,
      paymentAmount: fromAmount,
      externalId: payment_id,
      address: _address,
      email: "",
      //postbackUrl : postbackUrl,
      successUrl: successUrl,
      failUrl: failUrl,
    };
    const seed = network === "testnet" ? "Fhg5x79TFf" : "VelasWallet";

    const headers = {
      "Content-Type": "application/json;charset=UTF-8",
      "X-AUTH-SID": seed,
      "X-AUTH-NONCE": Date.now(),
    };

    //web3 signature
    //function sha256(string) {
    //return crypto
    //.createHash("sha256")
    //.update(address)
    //.digest("hex");
    //}

    //const publicKey = "0x14669e50587b5406b6f8bf64dbb129e564939e1a1f77bff71d210f828dff1f39977086bf388714a3541c13a4aa3e86caf4ccecf6ce0fd8ee445d0c78c173a76a"
    //const signature = sha256(publicKey);
    //const link = "https://app-stage.utorg.pro/direct/" + seed + "/" + _address + "/?currency="+currency+"&timestamp="+Date.now()+"&signature="+signature+"&paymentAmount=" + fromAmount + "&successUrl=" + checkout_url;
    //return window.location.replace(link);
    // end web3 signature
    try {
      const quoteResult = await makeQuery({ url: `${paymentUrl}`, params });
      //      const quoteResult = await axios.post(`${paymentUrl}`, params, {headers});
      if (!quoteResult.data.success) return;
      const { url, id, mId } = quoteResult.data.data; // mId "2dc1c88a96a145f9c6e9c76b78920f93c84e25e1"
      if (!url) return;
      //window.location.replace(url);
      const orderId = id;

      sessionStorage.setItem("loaded", "yes");
      newUrlParams();

      //Open in the same tab
      // window.location.replace(url);

      //Open in the same tab, without replace url
      window.open(url, "_self", "noopener,noreferrer");

      // Open new tab with generated link
      // window.open(url, "_blank") ;

      //Open Checkout page and waiting for postback response.
      //      props.redirectTo({
      //        pathname: `/provider/utorg/checkout?payment_id=${encodeURIComponent(payment_id)}`,
      //        state: {
      //          selectedProvider: selectedProvider,
      //          payment_id: payment_id,
      //          orderId: id,
      //          mId: mId,
      //          step: "WAIT_FOR_POSTBACK"
      //        }
      //      });
    } catch (err) {
      let errMsg = "";
      console.error("@!!! caught error ", err);
      if (err.response && err.response.data && err.response.data.error) {
        const errorObj = err.response.data.error.details;
        if ({}.toString.call(errorObj).slice(8, -1) === "Array") {
          errMsg = errorObj
            .map((it) => {
              const field = Object.keys(it).length ? Object.keys(it)[0] : "";
              const reason =
                it[`${field}`] || "Sorry, unexpected error occurred.";
              return `${field}: ${reason}`;
            })
            .join(",");
        }
      } else {
        errMsg = `<p className="info-style">Sorry, unexpected error occurred.`;
      }

      Swal.fire({
        icon: "error",
        title: "Oops...",
        html: errMsg,
      });
    }
  };

  const [focusInput, setFocusInput] = useState(false);
  const handleChangeValid = () => {
    setFocusInput(true);
  };

  const inputAddress = () => {
    return (
      <>
        <Form.Label className="left-side-p">
          VLX ({displayCryptoCurrency}) address
        </Form.Label>
        <a
          href={VELAS_WALLET_DOMAIN}
          className="active link_btn"
          target="_blank"
          rel="noopener noreferrer nofollow"
        >
          Don't have one?
        </a>
        <InputGroup className="mb-10">
          <FormControl
            value={address}
            onChange={handleChange}
            onFocus={handleChangeValid}
            placeholder={`Your ${displayCryptoCurrency} wallet`}
            isInvalid={
              !isValidAddress({ address, token: selectedCryptoCurrency })
            }
            maxLength={selectedCryptoCurrency === "VLX(EVM)" ? 42 : 44}
          />
        </InputGroup>
      </>
    );
  };

  const onInfo = () => {
    Swal.fire({
      icon: "info",
      title: title_info,
      html: body_utorg,
    });
  };

  const disableButton =
    toAmount <= 0 ||
    !isValidAddress({ address, token: selectedCryptoCurrency }) ||
    (ALL_REQUIRED_PARAMS_MISSED && !address) ||
    (selectedCryptoCurrency === "vlx" && valid_address_evm !== "0x") ||
    (selectedCryptoCurrency === "vlx_native" && valid_address_evm === "0x") ||
    amountLessThanMin ||
    amountMoreThanMax ||
    (ALL_REQUIRED_PARAMS_MISSED &&
      selectedCryptoCurrency === "vlx" &&
      address.length < 42) ||
    (ALL_REQUIRED_PARAMS_MISSED &&
      selectedCryptoCurrency === "vlx_native" &&
      address.length < 44) ||
    !selectedProvider;

  if (
    Object.keys(tickerData).length === 0 ||
    Object.keys(tickerFiatData).length === 0
  ) {
    return <EmptyView pageIsLoading={pageIsLoading} />;
  }

  // console.log('selectedCryptoCurrency', selectedCryptoCurrency)

  const action = UTORG_PAYMENT_URIS[`${domain}/${network}`];
  const _minAmount = +minAmount === 0 ? "..." : minAmount.toFixed(2);
  const _maxAmount = +maxAmount === 0 ? "..." : maxAmount.toFixed(2);

  const addressCut =
    (parsed.address || address).substring(0, 8) + "..." + address.substring(35);

  const onSetSelectedCryptoCurrency = async (e) => {
    setSelectedCryptoCurrency(e);
    await fetchCryptoRate({ cryptoCurrency: e });
  };

  return (
    <>
      <Form
        className="form-step-2 input-form mt-3"
        method="POST"
        ref={formRef}
        action={action}
      >
        <div className="col-md-10 offset-md-1">
          <Form.Group>
            <div id="input-block">
              <span className="fiat-amount" id="input-amount">
                <CurrencyRow
                  onChangeAmount={handleFromAmountChange}
                  amount={toFixed(fromAmount, 2)}
                  placeholder="0.00"
                  label={"I Want to Spend"}
                  selectedRow={selectedFiat}
                  setSelectedRow={handleSelectFiat}
                  currencies={SUPPORTED_CURRENCIES}
                  disabled={!selectedProvider}
                />
              </span>
              <span id="input-amount">
                <CurrencyRow
                  onChangeAmount={handleToAmountChange}
                  amount={toFixed(toAmount, 2)}
                  placeholder="0.00"
                  label={"I Will Receive"}
                  selectedRow={
                    CRYPTO_CURRENCIES_kv[`${selectedCryptoCurrency}`]
                  }
                  setSelectedRow={onSetSelectedCryptoCurrency}
                  cryptoCurrencies={CRYPTO_CURRENCIES_kv}
                  disabled={parsed.crypto_currency != null}
                />
              </span>
            </div>

            {!parsed.address && inputAddress()}

            {selectedFiat && (
              <>
                <div className="row_notice_sub">
                  <p className="left-side-p">Minimum purchase amount:</p>
                  {selectedProvider ? (
                    <p className={amountLessThanMin ? "red" : "black-14"}>
                      {" "}
                      {_minAmount} {selectedFiat || parsed.fiat_currency}
                    </p>
                  ) : (
                    <p className="black-14">...</p>
                  )}
                </div>
                {selectedProvider && (
                  <div className="row_notice_sub">
                    <p className="left-side-p">Maximum purchase amount:</p>
                    {selectedProvider ? (
                      <p className={amountMoreThanMax ? "red" : "black-14"}>
                        {" "}
                        {_maxAmount} {selectedFiat || parsed.fiat_currency}
                      </p>
                    ) : (
                      <p className="black-14">...</p>
                    )}
                  </div>
                )}

                {parsed.address && (
                  <div className="row_notice">
                    <p className="left-side-p">Your address:</p>
                    <p title={address} className="black-14">
                      {addressCut}
                    </p>
                  </div>
                )}
              </>
            )}
          </Form.Group>
          <div>
            {tickerData.vlx_price && (
              <div className="left-side-p mt-30 mb-10">
                Reference Price:{" "}
                <span className="black-14">
                  1 VLX ≈ {parseFloat(tickerData.vlx_price).toFixed(4)} USD
                </span>
              </div>
            )}
          </div>
          <Button
            variant="primary buy-button"
            onClick={onSubmitUtorg}
            disabled={disableButton}
          >
            {`Buy VLX (${displayCryptoCurrency})`}
          </Button>
          <input type="hidden" name="version" value="1" />
          <input type="hidden" name="partner" value={PARTNER_NAME} />
          <input type="hidden" name="payment_flow_type" value="wallet" />
          <input type="hidden" name="return_url_success" value={checkout_url} />
          <input type="hidden" name="payment_id" value={payment_id} />
        </div>
      </Form>
    </>
  );
};

export default PaymentDetails;
