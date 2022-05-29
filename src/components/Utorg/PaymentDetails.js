import React, { useState, useMemo, useRef, useEffect } from "react";
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
  UTORG_PAYMENT_URIS,
  UTORG_DOMAIN,
  TICKER_URL,
  TICKER_URL_FIXER,
} from "../../utils/constants";
import queryString from "query-string";
import { v4 as uuidv4 } from "uuid";
import Swal from "sweetalert2";
import EmptyView from "../EmptyView";
import { BsInfoCircle } from "react-icons/bs";
import { title_info, body_utorg } from "../InfoMsg";

const PARTNER_NAME = "velas";
const VELAS_WALLET_DOMAIN = "https://wallet.velas.com/";
const DEFAULT_MIN_AMOUNT_USD = 50;
const DEFAULT_MAX_AMOUNT_USD = 20000;
const DEFAULT_RECEIVE_CRYPTO_AMOUNT = 300;
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

const parsed = queryString.parse(global.location.search);
const ALL_REQUIRED_PARAMS_MISSED = !parsed.address && !parsed.crypto_currency && !parsed.env;
const network = parsed.env === "wallet_testnet" ? "testnet" : "mainnet";
const domain  = UTORG_DOMAIN[`${network}`];

const CurrencyRow = ({
  onChangeAmount,
  amount,
  placeholder,
  label,
  selectedRow,
  setSelectedRow,
  currencies,
  disabled,
  disabledItem,
}) => {
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
        </DropdownButton>
      </InputGroup>
    </>
  );
};
const PaymentDetails = (props) => {
  const payment_id = useMemo(uuidv4, []);
  const checkout_url = `${
    global.location.origin
  }/provider/checkout/${encodeURIComponent(payment_id)}/${encodeURIComponent(
    parsed.env
  )}`;
  const error_url = `${
    global.location.origin
  }/provider/error/${encodeURIComponent(payment_id)}/${encodeURIComponent(
    parsed.env
  )}`;
  const [tickerData, setTickerData] = useState({});
  const [tickerFiatData, setTickerFiatData] = useState({});
  const [currencyData, setCurrencyData] = useState({});
  const [minAmount, setMinAmount] = useState(0);
  const [maxAmount, setMaxAmount] = useState(0);
  const [amountInFromCurrency, setAmountInFromCurrency] = React.useState(true);
  const pathsName = global.location.pathname.split("/provider/")[1].split("/");
  const selectProvider = pathsName[0];

  const [amount, setAmount] = useState(DEFAULT_RECEIVE_CRYPTO_AMOUNT);
  const [amountFrom, setAmountFrom] = useState("");
  const [amountTo, setAmountTo] = useState("");
  const [address, setAddress] = useState("");
  const [selectedFiat, setSelectedFiat] = useState("USD");
  const [pageIsLoading, setPageIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      //VLX
      try {
        const result = await fetch(TICKER_URL);
        const rates = await result.json();

        // Add rate for usdv token
        rates.vlx_usdv_price = '1.13';
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

      try {
        const currencyResult = await makeQuery({ url: "api/merchant/v1/settings/currency" });
        if (currencyResult && currencyResult.data && currencyResult.data.data) {
          const data = currencyResult.data.data;
          const currData = {};
          data.forEach( it => {
            currData[it.currency] = { min: it.withdrawalMin, max: it.withdrawalMax }
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

    fetchData();

    //cleanup
    localStorage.removeItem("storageProvider");

  }, []);

  const handleChange = (e) => {
    setAddress(e.target.value);
  };

  const handleSelectFiat = (fiat) => {
    setSelectedFiat(fiat);
    const chosenCurrencyData = currencyData[`${fiat}`];
    if (!chosenCurrencyData)
      return console.error(`${fiat} was not found in currencyData object.`);
    const { min, max } = chosenCurrencyData;
    setMinAmount(min);
    setMaxAmount(max);
  }

  let valid_address_evm = queryString.parse(parsed.address || address);
  const stringified_valid = queryString.stringify(valid_address_evm);
  valid_address_evm = stringified_valid.substr(0, 2);
  const crypto_currency = (parsed.crypto_currency || "").toLowerCase();

  const [selected, setSelected] = useState(
    ALL_REQUIRED_PARAMS_MISSED
      ? "VLX(EVM)"
      : crypto_currency === "vlx" && valid_address_evm === "0x"
      ? "VLX(EVM)"
      : "VLX(NATIVE)" && crypto_currency === "vlx_usdv"
      ? "VLX(USDV)"
      : "VLX(NATIVE)"
  );

  let toAmount, fromAmount;
  let amountLessThanMin = false;
  let amountMoreThanMax = false;

  const toUsd = (amount) => {
    return amount / (tickerFiatData["USD"] || 1);
  }

  if (tickerData && tickerFiatData) {
    const usd_amount_of_1_Euro = tickerFiatData["USD"];
    const fiatRate = tickerFiatData[selectedFiat]; // cost selected currency in eur
    const cryptoPriceKey = crypto_currency === "vlx" ? "price_usd" : `${crypto_currency}_price`;
    const crypto_usd_rate = tickerData[cryptoPriceKey];
    const crypto_fiat_rate = crypto_usd_rate * toUsd(fiatRate);
    const FIAT_PER_CRYPTO = selectedFiat === "EUR" ? toUsd(crypto_usd_rate) : crypto_fiat_rate;

    //console.log({FIAT_PER_CRYPTO, crypto_usd_rate})

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

  const validCurrencyForUtorg = () => {
    if (ALL_REQUIRED_PARAMS_MISSED && selected === "VLX(EVM)") {
      return "VLXETH";
    }
    if (ALL_REQUIRED_PARAMS_MISSED && selected === "VLX(NATIVE)") {
      return "VLX";
    }
    if (ALL_REQUIRED_PARAMS_MISSED && selected === "VLX(USDV)") {
      return "USDVEL";
    }
    if (valid_address_evm === "0x" && crypto_currency !== "vlx_usdv") {
      return "VLXETH";
    }
    if (crypto_currency === "vlx" && valid_address_evm !== "0x") {
      return "VLX";
    }
    if (crypto_currency === "vlx_usdv") {
      return "USDVEL";
    }
  };

  const makeQuery = async ({ url, params }) => {
    const seed = network === 'testnet' ? 'Fhg5x79TFf' : 'VelasWallet';
    const headers = {
      'Content-Type': 'application/json;charset=UTF-8',
      'X-AUTH-SID': seed,
      'X-AUTH-NONCE': Date.now(),
    };
    const _params = !params ? {} : params;

    const quoteResult = await axios.post(`${domain}/${url}`, _params, { headers });
    return quoteResult;
  }

  const onSubmitUtorg = async () => {
    const paymentCurrency = (selectedFiat || parsed.fiat_currency).toUpperCase();
    const paymentUrl = UTORG_PAYMENT_URIS[`${network}`];
    const _address = ALL_REQUIRED_PARAMS_MISSED ? address : parsed.address

    const currency = validCurrencyForUtorg();
    const checkout_url = `${
      global.location.origin
    }/provider/utorg/checkout/${encodeURIComponent(payment_id)}/${encodeURIComponent(
      parsed.env
    )}`;
    const error_url = `${
      global.location.origin
    }/provider/error/${encodeURIComponent(payment_id)}/${encodeURIComponent(
      parsed.env
    )}`;

    const params = {
      type: "FIAT_TO_CRYPTO",
      currency : currency,
      paymentCurrency : paymentCurrency,
      paymentAmount : fromAmount,
      externalId : payment_id,
      address : _address,
      email : "",
      postbackUrl : "https://merchant.com/utorg/callback",
      successUrl : checkout_url,
      failUrl : error_url
    };
    const seed = network === 'testnet' ? 'Fhg5x79TFf' : 'VelasWallet';

    const headers = {
      'Content-Type': 'application/json;charset=UTF-8',
      'X-AUTH-SID': seed,
      'X-AUTH-NONCE': Date.now(),
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
      const { url } = quoteResult.data.data;
      if (!url) return;
      window.location.replace(url);
    } catch (err) {
      let errMsg = "";
      console.error("@!!! caught error ", err)
      if (err.response && err.response.data && err.response.data.error) {
        const errorObj = err.response.data.error.details;
        if (({}.toString).call(errorObj).slice(8, -1) === 'Array') {
          errMsg = errorObj.map(it => {
            const field = Object.keys(it).length ? Object.keys(it)[0] : "";
            const reason = it[`${field}`] || "Sorry, unexpected error occurred.";
            return `${field}: ${reason}`;
          }).join(',');
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

  const validForm =
    !address ||
    (selected === "VLX(EVM)" && valid_address_evm !== "0x") ||
    (selected === "VLX(NATIVE)" && valid_address_evm === "0x") ||
    (ALL_REQUIRED_PARAMS_MISSED && selected === "VLX(EVM)" && address.length < 42) ||
    (ALL_REQUIRED_PARAMS_MISSED && selected === "VLX(NATIVE)" && address.length < 44) ||
    (selected === "VLX(USDV)" && valid_address_evm !== "0x");

  const inputAddress = () => {
    return (
      <>
        <Form.Label className="left-side-p">{selected} address</Form.Label>
        <a href={VELAS_WALLET_DOMAIN} className="active link_btn" target="_blank" rel="noreferrer">
          Don't have one?
        </a>
        <InputGroup className="mb-3">
          <FormControl
            value={address}
            onChange={handleChange}
            onFocus={handleChangeValid}
            placeholder="Enter wallet address"
            isInvalid={focusInput ? validForm : false}
            maxLength={selected === "VLX(EVM)" ? 42 : 44}
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
    (ALL_REQUIRED_PARAMS_MISSED && !address) ||
    (selected === "VLX(EVM)" && valid_address_evm !== "0x") ||
    (selected === "VLX(NATIVE)" && valid_address_evm === "0x") ||
    amountLessThanMin ||
    amountMoreThanMax ||
    (ALL_REQUIRED_PARAMS_MISSED && selected === "VLX(EVM)" && address.length < 42) ||
    (ALL_REQUIRED_PARAMS_MISSED && selected === "VLX(NATIVE)" && address.length < 44) ||
    !selectProvider ||
    (selected === "VLX(USDV)" && valid_address_evm !== "0x");

  if (ALL_REQUIRED_PARAMS_MISSED || Object.keys(tickerData).length === 0 || Object.keys(tickerFiatData).length === 0) {
    return (
      <EmptyView
        pageIsLoading={pageIsLoading}
      />
    )
  }



  const action = UTORG_PAYMENT_URIS[`${domain}/${network}`];
  const _minAmount = +minAmount === 0 ? "..." : minAmount;
  const _maxAmount = +maxAmount === 0 ? "..." : maxAmount;

  return (
    <>
      <Form
        className="form-step-2 pay-form input-form mt-3"
        method="POST"
        ref={formRef}
        action={action}
      >
        <motion.div
          className="col-md-10 offset-md-1"
          initial={{ x: "-5vw" }}
          animate={{ x: 0 }}
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
                  setSelectedRow={handleSelectFiat}
                  currencies={SUPPORTED_CURRENCIES}
                />
              </span>
              <span id="input-amount">
                <CurrencyRow
                  onChangeAmount={handleToAmountChange}
                  amount={toAmount}
                  placeholder="0.00"
                  label={"Receive"}
                  selectedRow={selected}
                  setSelectedRow={setSelected}
                  currency1={"VLX(USDV)"}
                  disabled={!ALL_REQUIRED_PARAMS_MISSED && true}
                />
              </span>
            </div>

            {ALL_REQUIRED_PARAMS_MISSED && inputAddress()}

            {selectedFiat && (
              <>
                <div className="row_notice_sub min-purchase-amount">
                  <p className="left-side-p">Minimum purchase amount:</p>
                  {selectProvider ? (
                    <p
                      className={
                        amountLessThanMin
                          ? "red"
                          : null
                      }
                    >
                      {" "}
                      { _minAmount }{" "}
                      {selectedFiat || parsed.fiat_currency}
                    </p>
                  ) : (
                    <p>...</p>
                  )}
                </div>
                <div className="row_notice_sub max-purchase-amount">
                  <p className="left-side-p">Maximum purchase amount:</p>
                  {selectProvider ? (
                    <p
                      className={
                        amountMoreThanMax
                          ? "red"
                          : null
                      }
                    >
                      {" "}
                      { _maxAmount }{" "}
                      {selectedFiat || parsed.fiat_currency}
                    </p>
                  ) : (
                    <p>...</p>
                  )}
                </div>
                {!ALL_REQUIRED_PARAMS_MISSED && (
                  <div className="row_notice_sub">
                    <p className="left-side-p pay-with">Pay with:</p>
                    <p className="fee-info" style={{textTransform: "capitalize"}}>
                      {selectProvider ? selectProvider : "..."}
                      {selectProvider && (
                        <BsInfoCircle onClick={onInfo} className="info-icon" />
                      )}
                    </p>
                  </div>
                )}
              </>
            )}
          </Form.Group>

          <Button
            variant="primary"
            onClick={onSubmitUtorg}
            disabled={disableButton}
          >
            {"Buy"}
          </Button>
          <input type="hidden" name="version" value="1" />
          <input type="hidden" name="partner" value={PARTNER_NAME} />
          <input type="hidden" name="payment_flow_type" value="wallet" />
          <input type="hidden" name="return_url_success" value={checkout_url} />
          <input type="hidden" name="return_url_fail" value={error_url} />
          <input type="hidden" name="payment_id" value={payment_id} />
        </motion.div>
      </Form>
    </>
  );
};

export default PaymentDetails;
