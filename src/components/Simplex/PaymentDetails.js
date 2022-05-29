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
import { BsInfoCircle } from "react-icons/bs";
import transakSDK from "@transak/transak-sdk";
import useGeoLocation from "react-ipgeolocation";
import { countries_low_fee, countries_high_fee } from "../../utils/countries";
import { title_info, body, body_transak } from "../InfoMsg";

const vlx_evm = "VLX-EVM";
const PARTNER_NAME = "velas";
const VELAS_WALLET_DOMAIN = "https://wallet.velas.com/";
const DEFAULT_MIN_AMOUNT_USD = 30;
const DEFAULT_MAX_AMOUNT_USD = 20000;
const DEFAULT_RECEIVE_CRYPTO_AMOUNT = 300;

const parsed = queryString.parse(global.location.search);
const ALL_REQUIRED_PARAMS_MISSED = !parsed.address && !parsed.crypto_currency && !parsed.env;
const network = parsed.env === "wallet_testnet" ? "testnet" : "mainnet";


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
  const [isLoading, setIsLoading] = useState(false);
  const [amountInFromCurrency, setAmountInFromCurrency] = React.useState(true);
  const [pageIsLoading, setPageIsLoading] = useState(true);

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

  const pathsName = global.location.pathname.split("/provider/")[1].split("/");
  const selectProvider = pathsName[0];

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
      setPageIsLoading(false);
    }
    fetchData();

    //cleanup
    localStorage.removeItem("storageProvider");
  }, []);


  const [amount, setAmount] = useState(DEFAULT_RECEIVE_CRYPTO_AMOUNT);
  const [amountFrom, setAmountFrom] = useState("");
  const [amountTo, setAmountTo] = useState("");
  const [address, setAddress] = useState("");
  let [selectedFiat, setSelectedFiat] = useState("USD");
  const [widget, setWidget] = useState(false);

  const checkTransak = selectProvider === "transak";
  const checkSimplex = selectProvider === "simplex";

  if (checkTransak) {
    selectedFiat = "EUR"; //default value
  }

  if (selectProvider === "transak" && location.country && !checkCountry && !checkCountry1) {
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

  let validate_amount_min_eur = 0;
  let validate_amount_max_eur = 0; //not included, do it
  let toAmount, fromAmount, rate_euro;
  let amount_calc, amountCrypto;
  let min_usd_valid = 0;
  let min_eur_valid = 0;

  const minimalAmounts = {
    Simplex: 50,
    Transak: 30,
  };

  const MIN_AMOUNT_USD = minimalAmounts[selectProvider] || DEFAULT_MIN_AMOUNT_USD;
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

  let transak = new transakSDK({
    apiKey:
      TRANSAK_API_KEY[
        window.location.host === "buy.velas.com" ? "mainnet" : "testnet"
      ],
    environment:
      window.location.host === "buy.velas.com" ? "PRODUCTION" : "STAGING",
    walletAddress: ALL_REQUIRED_PARAMS_MISSED ? address : parsed.address,
    themeColor: "#0037c1",
    fiatCurrency: "EUR",
    email: "",
    hostURL: window.location.origin,
    widgetHeight: "600px",
    widgetWidth: "100%",
    hideMenu: true,
    fiatAmount: fromAmount,
    defaultPaymentMethod: "credit_debit_card",
    disablePaymentMethods: "sepa_bank_transfer, gbp_bank_transfer, apple_pay",
    network: ALL_REQUIRED_PARAMS_MISSED
      ? selected === "VLX(EVM)"
        ? "velasevm"
        : "mainnet"
      : parsed.crypto_currency && valid_address_evm === "0x"
      ? "velasevm"
      : "mainnet", //velasevm or mainnet
    defaultCryptoCurrency: "VLX",
    cryptoCurrencyCode: "VLX",
    disableWalletAddressForm: true,
  });

  const onSubmitTransak = () => {
    transak.on(transak.EVENTS.TRANSAK_WIDGET_OPEN, (data) => {
      setWidget(true);
    });
    transak.on(transak.EVENTS.TRANSAK_WIDGET_CLOSE, (data) => {
      setWidget(false);
    });
    transak.on(transak.EVENTS.TRANSAK_ORDER_SUCCESSFUL, (data) => {
      // console.log('data', data.status.status);
      transak.close();
      window.location.href = `${
        global.location.origin
      }/provider/checkout/${encodeURIComponent(
        data.status.id
      )}/${encodeURIComponent(parsed.env)}/${encodeURIComponent(
        data.status.status
      )}`;
    });
    transak.on(transak.EVENTS.TRANSAK_ORDER_FAILED, (data) => {
      transak.close();
      window.location.href = `${
        global.location.origin
      }/provider/checkout/${encodeURIComponent(
        data.status.id
      )}/${encodeURIComponent(parsed.env)}/${encodeURIComponent(
        data.status.status
      )}`;
    });
    transak.on(transak.EVENTS.TRANSAK_ORDER_CANCELLED, (data) => {
      transak.close();
      window.location.href = `${
        global.location.origin
      }/provider/checkout/${encodeURIComponent(
        data.status.id
      )}/${encodeURIComponent(parsed.env)}/${encodeURIComponent(
        data.status.status
      )}`;
    });
    transak.init();
  };
  const onSubmit = (event) => {
    event.returnValue = false;
    setIsLoading(false);
    onSubmit_();
    return false;
  };
  // console.log('amountCrypto', amountCrypto)

  const onSubmit_ = async () => {
    // console.log("payment_id", payment_id);
    setIsLoading(true);

    try {
      const params = {
        crypto_currency: ALL_REQUIRED_PARAMS_MISSED
          ? selected === "VLX(EVM)"
            ? "VLX-EVM"
            : "VLX"
          : parsed.crypto_currency && valid_address_evm === "0x"
          ? vlx_evm
          : parsed.crypto_currency,
        fiat_currency: selectedFiat || parsed.fiat_currency,
        crypto_amount: Number(amountCrypto),
        address: ALL_REQUIRED_PARAMS_MISSED ? address : parsed.address,
      };
      const domain = SIMPLEX_DOMAIN[network];
      const quoteResult = await axios.post(`${domain}${BASE_API_URL}/quote`, params);

      if (quoteResult.data.error) throw new Error(quoteResult.data.error);

      const paramsPayment = {
        quote_id: quoteResult.data.quote_id,
        address: ALL_REQUIRED_PARAMS_MISSED ? address : parsed.address,
        payment_id: payment_id,
        crypto_currency: ALL_REQUIRED_PARAMS_MISSED
          ? selected === "VLX(EVM)"
            ? "VLX-EVM"
            : "VLX"
          : parsed.crypto_currency && valid_address_evm === "0x"
          ? vlx_evm
          : parsed.crypto_currency,
      };

      const paymentResult = await axios.post(
        `${domain}${BASE_API_URL}/payment`,
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

  const providerInfo = {
    simplex: body,
    transak: body_transak
  };

  const onInfo = () => {
    Swal.fire({
      icon: "info",
      title: title_info,
      html: providerInfo[selectProvider],
    });
  };

  const valid_btn =
    amountCrypto <= 0 ||
    (ALL_REQUIRED_PARAMS_MISSED && !address) ||
    (selected === "VLX(EVM)" && valid_address_evm !== "0x") ||
    (selected === "VLX(NATIVE)" && valid_address_evm === "0x") ||
    min_usd_valid ||
    min_eur_valid ||
    (ALL_REQUIRED_PARAMS_MISSED && selected === "VLX(EVM)" && address.length < 42) ||
    (ALL_REQUIRED_PARAMS_MISSED && selected === "VLX(NATIVE)" && address.length < 44) ||
    (ALL_REQUIRED_PARAMS_MISSED && !selectProvider) ||
    widget ||
    !selectProvider ||
    (selected === "VLX(USDV)" && valid_address_evm !== "0x");

  if ((!ALL_REQUIRED_PARAMS_MISSED && !parsed.address) || (!ALL_REQUIRED_PARAMS_MISSED && !parsed.crypto_currency) || Object.keys(tickerData).length === 0 || Object.keys(tickerFiatData).length === 0)
    return (
      <EmptyView
        pageIsLoading={pageIsLoading}
      />
    );

  const action = selectProvider === "simplex" ? SIMPLEX_PAYMENT_URIS[`${network}`] : "";

  return (
    <>
      <Form
        className="form-step-2 input-form mt-3"
        method="POST"
        ref={formRef}
        onSubmit={
          selectProvider === "simplex" ? onSubmit : onSubmitTransak
        }
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
                  currencies={["USD","EUR"]} //TODO: retrieve data from new supportedCurrencies object
                  disabled={checkTransak && true}
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
                  disabled={!ALL_REQUIRED_PARAMS_MISSED && true}
                />
              </span>
            </div>

            {ALL_REQUIRED_PARAMS_MISSED && inputAddress()}

            {selectedFiat && (
              <>
                <div className="row_notice_sub">
                  <p className="left-side-p">Minimum purchase amount:</p>
                  {selectProvider ? (
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
            className="submit-button2"
            variant="primary"
            onClick={
              checkSimplex
                ? onSubmit
                : onSubmitTransak
            }
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
