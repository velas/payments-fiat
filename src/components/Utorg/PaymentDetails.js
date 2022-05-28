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
  BASE_API_URL,
  TICKER_URL,
  REDIRECT_URIS,
  TICKER_URL_FIXER,
} from "../../utils/constants";
import queryString from "query-string";
import { v4 as uuidv4 } from "uuid";
import Swal from "sweetalert2";
import EmptyView from "../EmptyView";
import Select from "react-select";
import { BsInfoCircle } from "react-icons/bs";
import useGeoLocation from "react-ipgeolocation";
import { countries_low_fee, countries_high_fee } from "../../utils/countries";
import { title_info, body, body_utorg } from "../InfoMsg";

const vlx_evm = "VLX-EVM";
const PARTNER_NAME = "velas";
const VELAS_WALLET_DOMAIN = "https://wallet.velas.com/";
const DEFAULT_MIN_AMOUNT_USD = 50;
const DEFAULT_MAX_AMOUNT_USD = 20000;
const DEFAULT_RECEIVE_CRYPTO_AMOUNT = 300;

const parsed = queryString.parse(global.location.search);
const valid = !parsed.address && !parsed.crypto_currency && !parsed.env;


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
      <Form.Label class="left-side-p">{label}</Form.Label>
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
  const [isLoading, setIsLoading] = useState(false);
  const [amountInFromCurrency, setAmountInFromCurrency] = React.useState(true);
  const pathsName = global.location.pathname.split("/provider/")[1].split("/");
  const selectProvider = pathsName[0];
  console.log({selectProvider})

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

  useEffect(() => {
    async function fetchData() {
      //VLX
      const result = await fetch(TICKER_URL);
      const rates = await result.json();

      // Add rate for usdv token
      rates.vlx_usdv_price = '1.13';
      setTickerData(rates);

      //Fiat
      const fiatData = await fetch(TICKER_URL_FIXER);
      setTickerFiatData(await fiatData.json());
    }
    fetchData();

    //cleanup
    localStorage.removeItem("storageProvider");

  }, []);


  const [amount, setAmount] = useState(DEFAULT_RECEIVE_CRYPTO_AMOUNT);
  const [amountFrom, setAmountFrom] = useState("");
  const [amountTo, setAmountTo] = useState("");
  const [address, setAddress] = useState("");
  const [selectedFiat, setSelectedFiat] = useState("USD");
  const [widget, setWidget] = useState(false);

  const handleChange = (e) => {
    setAddress(e.target.value);
  };

  let valid_address_evm = queryString.parse(parsed.address || address);
  const stringified_valid = queryString.stringify(valid_address_evm);
  valid_address_evm = stringified_valid.substr(0, 2);
  const crypto_currency = (parsed.crypto_currency || "").toLowerCase();

  const [selected, setSelected] = useState(
    valid
      ? "VLX(EVM)"
      : crypto_currency === "vlx" && valid_address_evm === "0x"
      ? "VLX(EVM)"
      : "VLX(NATIVE)" && crypto_currency === "vlx_usdv"
      ? "VLX(USDV)"
      : "VLX(NATIVE)"
  );

  let validate_amount_min_eur = 0;
  let validate_amount_max_eur = 0; //not included, do it
  let toAmount, fromAmount, rate_euro;
  let amount_calc, amountCrypto;
  let min_usd_valid = 0;
  let min_eur_valid = 0;


  const MIN_AMOUNT_USD = DEFAULT_MIN_AMOUNT_USD;
  const MAX_AMOUNT_USD = DEFAULT_MAX_AMOUNT_USD;

  const toUsd = (amount) => {
    return amount / tickerFiatData["USD"];
  }

  if (tickerData && tickerFiatData) {
    const usd_amount_of_1_Euro = tickerFiatData["USD"];
    const fiatRate = tickerFiatData[selectedFiat]; // cost selected currency in eur
    const cryptoPriceKey = crypto_currency === "vlx" ? "price_usd" : `${crypto_currency}_price`;
    const crypto_usd_rate = tickerData[cryptoPriceKey];
    const crypto_fiat_rate = crypto_usd_rate * toUsd(fiatRate);
    const FIAT_PER_CRYPTO = selectedFiat === "EUR" ? toUsd(crypto_usd_rate) : crypto_fiat_rate;

    console.log({FIAT_PER_CRYPTO, crypto_usd_rate})

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
        crypto_currency: valid
          ? selected === "VLX(EVM)"
            ? "VLX-EVM"
            : "VLX"
          : parsed.crypto_currency && valid_address_evm === "0x"
          ? vlx_evm
          : parsed.crypto_currency,
        fiat_currency: selectedFiat || parsed.fiat_currency,
        crypto_amount: Number(amountCrypto),
        address: valid ? address : parsed.address,
      };
      const quoteResult = await axios.post(`${BASE_API_URL}/quote`, params);

      if (quoteResult.data.error) throw new Error(quoteResult.data.error);

      const paramsPayment = {
        quote_id: quoteResult.data.quote_id,
        address: valid ? address : parsed.address,
        payment_id: payment_id,
        crypto_currency: valid
          ? selected === "VLX(EVM)"
            ? "VLX-EVM"
            : "VLX"
          : parsed.crypto_currency && valid_address_evm === "0x"
          ? vlx_evm
          : parsed.crypto_currency,
      };

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
  const validCurrencyForUtorg = () => {
    if (valid && selected === "VLX(EVM)") {
      return "VLXETH";
    }
    if (valid && selected === "VLX(NATIVE)") {
      return "VLX";
    }
    if (valid && selected === "VLX(USDV)") {
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

  const onSubmitUtorg = async () => {
    const paymentCurrency = (selectedFiat || parsed.fiat_currency).toUpperCase();
    const network = parsed.env === "wallet_testnet" ? "testnet" : "mainnet";
    const paymentUrl = UTORG_PAYMENT_URIS[`${network}`];
    const _address = valid ? address : parsed.address

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
      const quoteResult = await axios.post(`${paymentUrl}`, params, {headers});
      console.log({res: quoteResult.data})
      if (!quoteResult.data.success) return;
      const { url } = quoteResult.data.data;
      if (!url) return;
      window.location.replace(url);
    } catch (err) {
      let errMsg = "";

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
        errMsg = `<p class="info-style">Sorry, unexpected error occurred.`;
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
    (selected === "VLX(EVM)" && valid_address_evm != "0x") ||
    (selected === "VLX(NATIVE)" && valid_address_evm === "0x") ||
    (valid && selected === "VLX(EVM)" && address.length < 42) ||
    (valid && selected === "VLX(NATIVE)" && address.length < 44) ||
    (selected === "VLX(USDV)" && valid_address_evm != "0x");

  const inputAddress = () => {
    return (
      <>
        <Form.Label class="left-side-p">{selected} address</Form.Label>
        <a href={VELAS_WALLET_DOMAIN} class="active link_btn" target="_blank">
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

  const options = [
    { value: "Utorg", label: "Utorg (Visa/MC)" },
  ];



  const valid_btn =
    amountCrypto <= 0 ||
    (valid && !address) ||
    (selected === "VLX(EVM)" && valid_address_evm != "0x") ||
    (selected === "VLX(NATIVE)" && valid_address_evm === "0x") ||
    min_usd_valid ||
    min_eur_valid ||
    (valid && selected === "VLX(EVM)" && address.length < 42) ||
    (valid && selected === "VLX(NATIVE)" && address.length < 44) ||
    (valid && !selectProvider.value) ||
    widget ||
    !selectProvider ||
    (selected === "VLX(USDV)" && valid_address_evm != "0x");

  if ((!valid && !parsed.address) || (!valid && !parsed.crypto_currency))
    return <EmptyView />;

  const network = parsed.env === "wallet_testnet" ? "testnet" : "mainnet";
  const action = UTORG_PAYMENT_URIS[`${network}`];

  return (
    <>
      <Form
        className="form-step-2 input-form mt-3"
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
                  setSelectedRow={setSelectedFiat}
                  currencies={["USD","EUR","UAH","AUD","PLN","GBP"]} //TODO: retrieve data from new supportedCurrencies object
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
                  currency1={"VLX(EVM)"}
                  currency2={"VLX(NATIVE)"}
                  currency3={"VLX(USDV)"}
                  disabled={!valid && true}
                />
              </span>
            </div>

            {valid && inputAddress()}

            {selectedFiat && (
              <>
                <div class="row_notice_sub">
                  <p class="left-side-p">Minimum purchase amount:</p>
                  {selectProvider ? (
                    <p
                      class={
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
                {!valid && (
                  <div class="row_notice_sub">
                    <p class="left-side-p pay-with">Pay with:</p>
                    <p class="fee-info" style={{textTransform: "capitalize"}}>
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
            disabled={valid_btn}
          >
            {isLoading || widget ? "Loading..." : "Buy"}
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
