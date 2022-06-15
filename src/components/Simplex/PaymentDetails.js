import React, {
  useState,
  useMemo,
  useRef,
  useEffect
} from "react";
import {
  Form,
  Button,
  InputGroup,
  FormControl,
  DropdownButton,
  Dropdown,
} from "react-bootstrap";
import { motion } from "framer-motion";
import axios from "axios";
import {
  SIMPLEX_PAYMENT_URIS,
  BASE_API_URL,
  SIMPLEX_DOMAIN,
  TICKER_URL,
  TICKER_URL_FIXER,
  TRANSAK_API_KEY,
} from "../../utils/constants";
import queryString from "query-string";
import { v4 as uuidv4 } from "uuid";
import Swal from "sweetalert2";
import EmptyView from "../EmptyView";
import useGeoLocation from "react-ipgeolocation";
import { isValidAddress } from "../../utils/address-validation";
import { countries_low_fee, countries_high_fee } from "../../utils/countries";

const vlx_evm = "VLX-EVM";
const PARTNER_NAME = "velas";
const VELAS_WALLET_DOMAIN = "https://wallet.velas.com/";
const DEFAULT_MIN_AMOUNT_USD = 30;
const DEFAULT_MAX_AMOUNT_USD = 20000;
const DEFAULT_RECEIVE_CRYPTO_AMOUNT = 300;

const parsed = queryString.parse(global.location.search);
const ALL_REQUIRED_PARAMS_MISSED = !parsed.address && !parsed.crypto_currency && !parsed.env;
// const network = parsed.env === "wallet_testnet" ? "testnet" : "mainnet";
const CRYPTO_CURRENCIES_kv = {
  "vlx": "VLX(EVM)",
  "vlx_native":"VLX(NATIVE)",
}
const SUPPORTED_CURRENCIES = [
  "EUR",
  "USD",
];
const parsed_crypto_is_valid = parsed.crypto_currency && CRYPTO_CURRENCIES_kv[`${parsed.crypto_currency}`];
const DEFAULT_CRYPTO_CURRENCY = parsed.crypto_currency && CRYPTO_CURRENCIES_kv[`${(parsed.crypto_currency).toLowerCase()}`] ? (parsed.crypto_currency).toLowerCase() : 'vlx';

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
        />
        <DropdownButton
          title={selectedRow}
          id="dropdown-fiat"
          disabled={disabled}
        >
          {
            (currencies || []).map( it => {
              return (
                <Dropdown.Item
                  key={it}
                  style={{ fontSize: 12 }}
                  href="#"
                  active={selectedRow === it}
                  onSelect={() => setSelectedRow(it)}
                >
                  {it}
                </Dropdown.Item>
              )
            })
          }
          {
            (cryptos || []).map( it => {
              const name = CRYPTO_CURRENCIES_kv[`${it}`]
              return (
                <Dropdown.Item
                  key={name}
                  style={{ fontSize: 12 }}
                  href="#"
                  active={selectedRow === name}
                  onSelect={() => setSelectedRow(it)}
                >
                  {name}
                </Dropdown.Item>
              )
            })
          }
        </DropdownButton>
      </InputGroup>
    </>
  );
};
const PaymentDetails = (props) => {
  const payment_id = useMemo(uuidv4, []);
  const checkout_url = `${
    global.location.origin
  }/provider/simplex/checkout/${encodeURIComponent(payment_id)}/${encodeURIComponent(
    parsed.env
  )}`;
  const error_url = `${
    global.location.origin
  }/provider/error/${encodeURIComponent(payment_id)}/${encodeURIComponent(
    parsed.env
  )}`;
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
    global && global.location && global.location.pathname &&
    (global.location.pathname || "").split("/provider/").length > 1;

  const fetchData = async () => {
    //VLX
    try {
      const result = await fetch(TICKER_URL);
      const rates = await result.json();

      // Add rate for usdv token
      // rates.vlx_usdv_price = '1.13';
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
    setPageIsLoading(false);
  }

  useEffect(() => {
    if (props.selectedProvider) {
      setSelectedProvider(props.selectedProvider)
    } else {
      const pathsName = hasUrlProvider
        ? ((global.location.pathname).split("/provider/")[1] || "").split("/")
        : [] ;

      if (pathsName[0]) {
        setSelectedProvider(pathsName[0])
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
  let [selectedFiat, setSelectedFiat] = useState("USD");

  const checkTransak = selectedProvider === "transak";
  const checkSimplex = selectedProvider === "simplex";

  if (checkTransak) {
    selectedFiat = "EUR"; //default value
  }

  if (selectedProvider === "transak" && location.country && !checkCountry && !checkCountry1) {
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

  const crypto_currency = (parsed.crypto_currency && CRYPTO_CURRENCIES_kv[`${parsed.crypto_currency}`] ? parsed.crypto_currency : 'vlx').toLowerCase();
  const [selectedCryptoCurrency, setSelectedCryptoCurrency] = useState(DEFAULT_CRYPTO_CURRENCY);
  const displayCryptoCurrency = CRYPTO_CURRENCIES_kv[`${selectedCryptoCurrency}`];

  let validate_amount_min_eur = 0;
  let validate_amount_max_eur = 0; //not included, do it
  let toAmount, fromAmount, rate_euro;
  let amount_calc, amountCrypto;
  let min_usd_valid = 0;
  let min_eur_valid = 0;

  const minimalAmounts = {
    simplex: 50,
    transak: 30,
  };
  const MIN_AMOUNT_USD = minimalAmounts[selectedProvider] || DEFAULT_MIN_AMOUNT_USD;
  const MAX_AMOUNT_USD = DEFAULT_MAX_AMOUNT_USD;

  const toUsd = (amount) => {
    return amount / (tickerFiatData["USD"] || 1);
  }

  if (tickerData && tickerFiatData) {
    const usd_amount_of_1_Euro = tickerFiatData["USD"];
    const fiatRate = tickerFiatData[`${selectedFiat}`] || 0;
    const cryptoPriceKey = crypto_currency === "vlx" ? "price_usd" : `${crypto_currency}_price`;
    const crypto_usd_rate = tickerData[`${cryptoPriceKey}`] || 0;
    const crypto_fiat_rate = crypto_usd_rate * toUsd(fiatRate);
    const FIAT_PER_CRYPTO = selectedFiat === "EUR" ? toUsd(crypto_usd_rate) : crypto_fiat_rate;


    if (tickerFiatData) {
      const rate_eur_usd = tickerFiatData["USD"]; // coefficient eur/usd (Fixer)
      if (rate_eur_usd) {
        validate_amount_min_eur = toUsd(MIN_AMOUNT_USD * fiatRate);
        validate_amount_max_eur = toUsd(MAX_AMOUNT_USD * fiatRate);  // not included, do it
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

  const onSubmit = (event) => {
    event.returnValue = false;
    setIsLoading(false);
    onSubmit_();
    return false;
  };

  const onSubmit_ = async () => {
    setIsLoading(true);

    try {
      const params = {
        crypto_currency: ALL_REQUIRED_PARAMS_MISSED ? selectedCryptoCurrency === "vlx" ? "VLX-EVM" : "VLX" : parsed.crypto_currency && valid_address_evm === "0x" ? vlx_evm : "VLX",
        fiat_currency: selectedFiat || parsed.fiat_currency,
        crypto_amount: Number(amountCrypto),
        address: ALL_REQUIRED_PARAMS_MISSED ? address : parsed.address,
      };
      // const domain = SIMPLEX_DOMAIN[network];
      // const quoteResult = await axios.post(`${domain}${BASE_API_URL}/quote`, params);
      const quoteResult = await axios.post(`${BASE_API_URL}/quote`, params);


      if (quoteResult.data.error) throw new Error(quoteResult.data.error);

      const paramsPayment = {
        quote_id: quoteResult.data.quote_id,
        address: ALL_REQUIRED_PARAMS_MISSED ? address : parsed.address,
        payment_id: payment_id,
        crypto_currency: ALL_REQUIRED_PARAMS_MISSED ? selectedCryptoCurrency === "vlx" ? "VLX-EVM" : "VLX" : parsed.crypto_currency && valid_address_evm === "0x" ? vlx_evm : "VLX",
      };

      // const paymentResult = await axios.post(
      //   `${domain}${BASE_API_URL}/payment`,
      //   paramsPayment
      // );
      const paymentResult = await axios.post(
        `${BASE_API_URL}/payment`,
        paramsPayment
      );
      if (paymentResult.data.error) throw new Error(paymentResult.data.error);

      formRef.current.submit();
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: e.response?.data || e.message,
      });
      setIsLoading(false);
    }
  };

  const [focusInput, setFocusInput] = useState(false);
  const handleChangeValid = () => {
    setFocusInput(true);
  };


  const inputAddress = () => {
    return (
      <>
        <Form.Label className="left-side-p">{displayCryptoCurrency} address</Form.Label>
        <a href={VELAS_WALLET_DOMAIN} className="active link_btn" target="_blank" rel="noreferrer">
          Don't have one?
        </a>
        <InputGroup className="mb-3">
          <FormControl
            value={address}
            onChange={handleChange}
            onFocus={handleChangeValid}
            placeholder="Enter wallet address"
            isInvalid={!isValidAddress({ address, token: selectedCryptoCurrency })}
            maxLength={selectedCryptoCurrency === "VLX(EVM)" ? 42 : 44}
          />
        </InputGroup>
      </>
    );
  };

  const valid_btn =
    amountCrypto <= 0 ||
    !isValidAddress({ address: parsed.address || address, token: selectedCryptoCurrency }) ||
    (ALL_REQUIRED_PARAMS_MISSED && !address) ||
    (selectedCryptoCurrency === "vlx" && valid_address_evm !== "0x") ||
    (selectedCryptoCurrency === "vlx_native" && valid_address_evm === "0x") ||
    min_usd_valid ||
    min_eur_valid ||
    (ALL_REQUIRED_PARAMS_MISSED && selectedCryptoCurrency === "vlx" && address.length < 42) ||
    (ALL_REQUIRED_PARAMS_MISSED && selectedCryptoCurrency === "vlx_native" && address.length < 44) ||
    (ALL_REQUIRED_PARAMS_MISSED && !selectedProvider);

  if (Object.keys(tickerData).length === 0 || Object.keys(tickerFiatData).length === 0)
    return (
      <EmptyView
        pageIsLoading={pageIsLoading}
      />
    );

  // const action = selectedProvider === "simplex" ? SIMPLEX_PAYMENT_URIS[`${network}`] : "";
  const addressCut = (parsed.address || address).substring(0, 8) + "..." + (parsed.address || address).substring(35);

  return (
    <>
      <Form
        className="form-step-2 input-form mt-3"
        method="POST"
        ref={formRef}
        onSubmit={onSubmit}
        // action={action}
        action={
          SIMPLEX_PAYMENT_URIS[
            window.location.host === "buy.velas.com" ? "mainnet" : "testnet"
          ]
        }
      >
        <div
          className="col-md-10 offset-md-1"
        >
          <Form.Group>
            <div id="input-block">
              <span className="fiat-amount" id="input-amount">
                <CurrencyRow
                  onChangeAmount={handleFromAmountChange}
                  amount={fromAmount}
                  placeholder="0.00"
                  label={"Pay"}
                  selectedRow={selectedFiat}
                  setSelectedRow={setSelectedFiat}
                  currencies={SUPPORTED_CURRENCIES}
                  disabled={checkTransak}
                />
              </span>
              <span id="input-amount">
                <CurrencyRow
                  onChangeAmount={handleToAmountChange}
                  amount={toAmount}
                  placeholder="0.00"
                  label={"Receive"}
                  selectedRow={CRYPTO_CURRENCIES_kv[`${selectedCryptoCurrency}`]}
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
                              : null
                            : min_eur_valid
                            ? "red"
                            : null
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
                    <p>...</p>
                  )}
                </div>
                { parsed.address && (
                  <div className="row_notice">
                    <p className="left-side-p">Your address:</p>
                    <p title={address}>{addressCut}</p>
                  </div>
                )}
              </>
            )}
          </Form.Group>

          <Button
            className="submit-button2"
            variant="primary"
            onClick={onSubmit}
            disabled={valid_btn}
          >
            {isLoading ? "Loading..." : "Buy"}
          </Button>
          <input type="hidden" name="version" value="1" />
          <input type="hidden" name="partner" value={PARTNER_NAME} />
          <input type="hidden" name="payment_flow_type" value="wallet" />
          <input type="hidden" name="return_url_success" value={checkout_url} />
          <input type="hidden" name="return_url_fail" value={error_url} />
          <input type="hidden" name="payment_id" value={payment_id} />
        </div>
      </Form>
    </>
  );
};

export default PaymentDetails;
