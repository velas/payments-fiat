import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Form,
  Button,
  InputGroup,
  FormControl,
  DropdownButton,
  Dropdown,
} from "react-bootstrap";
import {
  TICKER_URL,
  TICKER_URL_FIXER,
  TRANSAK_API_KEY,
  TRANSAK_REDIRECT_URIS,
  TRANSAK_DOMAIN,
} from "../../utils/constants";
import queryString from "query-string";
import { v4 as uuidv4 } from "uuid";
import Swal from "sweetalert2";
import EmptyView from "../EmptyView";
import useGeoLocation from "react-ipgeolocation";
import { isValidAddress } from "../../utils/address-validation";
import { countries_low_fee, countries_high_fee } from "../../utils/countries";
import { isAndroid, isIOS } from "react-device-detect";
import axios from "axios";
import { toFixed } from "../../utils/format-value";
import CurrencyIcon from "../CurrencyIcon";

const vlx_evm = "VLX-EVM";
const PARTNER_NAME = "velas";
const VELAS_WALLET_DOMAIN = "https://wallet.velas.com/";
const DEFAULT_MIN_AMOUNT_USD = 30;
const DEFAULT_MAX_AMOUNT_USD = 20000;

const parsed = queryString.parse(global.location.search);
const ALL_REQUIRED_PARAMS_MISSED =
  !parsed.address && !parsed.crypto_currency && !parsed.env;
const network = parsed.env === "wallet_testnet" ? "testnet" : "mainnet";
const CRYPTO_CURRENCIES_kv = {
  vlx: "EVM",
  vlx_native: "NATIVE",
};

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

const SUPPORTED_CURRENCIES = ["EUR", "USD", "BRL"];
const parsed_crypto_is_valid =
  parsed.crypto_currency && CRYPTO_CURRENCIES_kv[`${parsed.crypto_currency}`];
// const DEFAULT_CRYPTO_CURRENCY = parsed.crypto_currency && CRYPTO_CURRENCIES_kv[`${(parsed.crypto_currency).toLowerCase()}`] ? (parsed.crypto_currency).toLowerCase() : 'vlx';

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
  const payment_id = useMemo(uuidv4, []);
  const [tickerData, setTickerData] = useState({});
  const [tickerFiatData, setTickerFiatData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [amountInFromCurrency, setAmountInFromCurrency] = React.useState(true);
  const [pageIsLoading, setPageIsLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState(null);

  const location = useGeoLocation();

  function checkArray(arr, val) {
    return arr.some(function (arrVal) {
      return val === arrVal;
    });
  }
  function checkArray1(arr, val) {
    return arr.some(function (arrVal) {
      return val === arrVal;
    });
  }
  const checkCountry = checkArray(countries_low_fee, location.country);
  const checkCountry1 = checkArray1(countries_high_fee, location.country);

  const hasUrlProvider =
    global &&
    global.location &&
    global.location.pathname &&
    (global.location.pathname || "").split("/provider/").length > 1;

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
    setPageIsLoading(false);
  };

  useEffect(() => {
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

  const [amount, setAmount] = useState(DEFAULT_RECEIVE_CRYPTO_AMOUNT);
  const [amountFrom, setAmountFrom] = useState(0);
  const [amountTo, setAmountTo] = useState(0);
  const [address, setAddress] = useState("");
  let [selectedFiat, setSelectedFiat] = useState("EUR");

  if (selectedFiat === "USD") {
    Swal.fire({
      icon: "info",
      title: "Oops...",
      html: `<p className="info-style">Sorry, but USD is currently not available. <br>Expect it soon.</br></p>`,
    });
    setSelectedFiat("EUR");
  }

  if (
    selectedProvider === "transak" &&
    location.country &&
    !checkCountry &&
    !checkCountry1
  ) {
    Swal.fire({
      icon: "info",
      title: "Oops...",
      html: `<p className="info-style">Sorry, but selected payment processing doesn’t work in your country.<br>Please choose another Payment Provider.</p>`,
    });
  }

  const handleChange = (e) => {
    setAddress(e.target.value);
  };

  let valid_address_evm = queryString.parse(parsed.address || address);
  const stringified_valid = queryString.stringify(valid_address_evm);
  valid_address_evm = stringified_valid.substr(0, 2);

  const crypto_currency = (
    parsed.crypto_currency && CRYPTO_CURRENCIES_kv[`${parsed.crypto_currency}`]
      ? parsed.crypto_currency
      : "vlx"
  ).toLowerCase();
  const [selectedCryptoCurrency, setSelectedCryptoCurrency] = useState(
    DEFAULT_CRYPTO_CURRENCY
  );
  const displayCryptoCurrency =
    CRYPTO_CURRENCIES_kv[`${selectedCryptoCurrency}`];

  let validate_amount_min_eur = 0;
  let validate_amount_max_eur = 0; //not included, do it
  let toAmount, fromAmount, rate_euro;
  let amount_calc, amountCrypto;
  let min_usd_valid = 0;
  let min_eur_valid = 0;

  const minimalAmounts = {
    transak: 30,
  };
  const MIN_AMOUNT_USD =
    minimalAmounts[selectedProvider] || DEFAULT_MIN_AMOUNT_USD;
  const MAX_AMOUNT_USD = DEFAULT_MAX_AMOUNT_USD;

  const toUsd = (amount) => {
    return amount / (tickerFiatData["USD"] || 1);
  };

  if (tickerData && tickerFiatData) {
    const usd_amount_of_1_Euro = tickerFiatData["USD"];
    const fiatRate = tickerFiatData[`${selectedFiat}`] || 0;
    const cryptoPriceKey =
      crypto_currency === "vlx" ? "price_usd" : `${crypto_currency}_price`;
    const crypto_usd_rate = tickerData[`${cryptoPriceKey}`] || 0;
    const crypto_fiat_rate = crypto_usd_rate * toUsd(fiatRate);
    const FIAT_PER_CRYPTO =
      selectedFiat === "EUR" ? toUsd(crypto_usd_rate) : crypto_fiat_rate;

    if (tickerFiatData) {
      const rate_eur_usd = tickerFiatData["USD"]; // coefficient eur/usd (Fixer)
      if (rate_eur_usd) {
        validate_amount_min_eur = toUsd(MIN_AMOUNT_USD * fiatRate);
        validate_amount_max_eur = toUsd(MAX_AMOUNT_USD * fiatRate); // not included, do it
        rate_euro = rate_eur_usd;
      }
    }
    if (amountInFromCurrency) {
      //Receive input
      toAmount = amount;
      fromAmount = (FIAT_PER_CRYPTO * amount).toFixed(2);

      if (amountTo) {
        amount_calc = toAmount;
      }
    } else {
      // Pay Input
      const amountReceive = (amountFrom / FIAT_PER_CRYPTO).toFixed(2);
      fromAmount = amountFrom;
      toAmount = amountReceive;

      if (amountTo) {
        amount_calc = amountReceive;
      }
    }

    amountCrypto = amountTo ? amount_calc : amount;

    min_usd_valid = amountCrypto * crypto_usd_rate < MIN_AMOUNT_USD;
    min_eur_valid =
      (amountCrypto * crypto_usd_rate) / rate_euro < MIN_AMOUNT_USD / rate_euro;

    sessionStorage.setItem("min_amount", Number(amountCrypto));
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

  const addUrlParams = () => {
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
    sessionStorage.setItem("loaded", "yes");
  };

  const createTransakUrl = () => {
    const queryParams = new URLSearchParams({
      apiKey:
        TRANSAK_API_KEY[
          window.location.host === "buy.velas.com" ? "mainnet" : "testnet"
        ],
      walletAddress: ALL_REQUIRED_PARAMS_MISSED ? address : parsed.address,
      themeColor: "#0037c1",
      fiatCurrency: selectedFiat || parsed.fiat_currency,
      hostURL: window.location.origin,
      hideMenu: true,
      fiatAmount: fromAmount,
      defaultPaymentMethod: "credit_debit_card",
      network: ALL_REQUIRED_PARAMS_MISSED
        ? selectedCryptoCurrency === "vlx"
          ? "velasevm"
          : "mainnet"
        : parsed.crypto_currency && valid_address_evm === "0x"
        ? "velasevm"
        : "mainnet", //velasevm or mainnet
      defaultCryptoCurrency: "VLX",
      cryptoCurrencyCode: "VLX",
      disableWalletAddressForm: true,
      redirectURL:
        TRANSAK_REDIRECT_URIS[
          window.location.host === "buy.velas.com" ? "mainnet" : "testnet"
        ],
    });
    return `${
      TRANSAK_DOMAIN[
        window.location.host === "buy.velas.com" ? "mainnet" : "testnet"
      ]
    }/?${queryParams}`;
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

  const valid_btn =
    amountCrypto <= 0 ||
    !isValidAddress({
      address: parsed.address || address,
      token: selectedCryptoCurrency,
    }) ||
    (ALL_REQUIRED_PARAMS_MISSED && !address) ||
    (selectedCryptoCurrency === "vlx" && valid_address_evm !== "0x") ||
    (selectedCryptoCurrency === "vlx_native" && valid_address_evm === "0x") ||
    min_usd_valid ||
    min_eur_valid ||
    (ALL_REQUIRED_PARAMS_MISSED &&
      selectedCryptoCurrency === "vlx" &&
      address.length < 42) ||
    (ALL_REQUIRED_PARAMS_MISSED &&
      selectedCryptoCurrency === "vlx_native" &&
      address.length < 44) ||
    (ALL_REQUIRED_PARAMS_MISSED && !selectedProvider) ||
    (location.country && !checkCountry && !checkCountry1);

  if (
    Object.keys(tickerData).length === 0 ||
    Object.keys(tickerFiatData).length === 0
  )
    return <EmptyView pageIsLoading={pageIsLoading} />;

  const action = "";
  const addressCut =
    (parsed.address || address).substring(0, 8) +
    "..." +
    (parsed.address || address).substring(35);

  return (
    <>
      <Form
        className="form-step-2 input-form mt-3"
        method="POST"
        ref={formRef}
        action={action}
        onSubmit={addUrlParams}
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
                  setSelectedRow={setSelectedFiat}
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
                  setSelectedRow={setSelectedCryptoCurrency}
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
                    <p
                      className={
                        amount
                          ? selectedFiat === "USD"
                            ? min_usd_valid
                              ? "red"
                              : "black-14"
                            : min_eur_valid
                            ? "red"
                            : 'black-14'
                          : null
                      }
                    >
                      {" "}
                      ~
                      {selectedFiat === "USD"
                        ? MIN_AMOUNT_USD
                        : Math.round(validate_amount_min_eur)}{" "}
                      {selectedFiat || parsed.fiat_currency}
                    </p>
                  ) : (
                    <p className="black-14">...</p>
                  )}
                </div>
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
          <a
            className="btn_link_buy"
            href={createTransakUrl()}
            target="_self"
            rel="noopener noreferrer nofollow"
          >
            <Button
              className="submit-button2"
              variant="primary buy-button"
              disabled={valid_btn}
              onClick={addUrlParams}
            >
              {isLoading ? "Loading..." : `Buy VLX (${displayCryptoCurrency})`}
            </Button>
          </a>
        </div>
      </Form>
    </>
  );
};

export default PaymentDetails;
