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
  SIMPLEX_PAYMENT_URIS,
  BASE_API_URL,
  TICKER_URL,
  REDIRECT_URIS,
  TICKER_URL_FIXER,
  TRANSAK_API_KEY,
} from "../../utils/constants";
import queryString from "query-string";
import { v4 as uuidv4 } from "uuid";
import Swal from "sweetalert2";
import EmptyView from "../EmptyView";
import Select from "react-select";
import { BsInfoCircle } from "react-icons/bs";
import transakSDK from "@transak/transak-sdk";
import useGeoLocation from "react-ipgeolocation";
import { countries_low_fee, countries_high_fee } from "../../utils/countries";
import {title_info, body, body_transak, body_utorg } from "../InfoMsg"

const parsed = queryString.parse(global.location.search);
// console.log('parsed', parsed)
const vlx_evm = "VLX-EVM";
const partner_name = "velas";
const valid = !parsed.address && !parsed.crypto_currency && !parsed.env;
const link_wallet = "https://wallet.velas.com/";

const CurrencyRow = ({
  onChangeAmount,
  amount,
  placeholder,
  label,
  selectedRow,
  setSelectedRow,
  currency1,
  currency2,
  currency3,
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
          <Dropdown.Item
            style={{ fontSize: 12 }}
            href="#"
            active={selectedRow === currency1}
            onSelect={() => setSelectedRow(currency1)}
          >
            {currency1}
          </Dropdown.Item>
          <Dropdown.Item
            style={{ fontSize: 12 }}
            href="#"
            active={selectedRow === currency2}
            onSelect={() => setSelectedRow(currency2)}
          >
            {currency2}
          </Dropdown.Item>
          <Dropdown.Item
            disabled={disabledItem}
            style={{ fontSize: 12 }}
            href="#"
            active={selectedRow === currency3}
            onSelect={() => setSelectedRow(currency3)}
          >
            {currency3}
          </Dropdown.Item>
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
  const [tickerData, setTickerData] = useState(null);
  const [tickerEurData, setTickerEurData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectProvider, setSelectProvider] = useState("");
  const [amountInFromCurrency, setAmountInFromCurrency] = React.useState(true);

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
      const result = await fetch(TICKER_URL);
      setTickerData(await result.json());
    }
    fetchData();
  }, []);
  useEffect(() => {
    async function fetchData() {
      const result_eur = await fetch(TICKER_URL_FIXER);
      setTickerEurData(await result_eur.json());
    }
    fetchData();
  }, []);
  useEffect(() => {
    let storageProvider = JSON.parse(localStorage.getItem("storageProvider"));
    if (!valid && storageProvider) {
      setSelectProvider(storageProvider);
    } else if (valid || !storageProvider) {
      localStorage.removeItem("storageProvider");
    }
  }, []);

  // console.log('selectProviderNew', selectProvider)

  const [amount, setAmount] = useState(300); // default value
  const [amountFrom, setAmountFrom] = useState("");
  const [amountTo, setAmountTo] = useState("");
  const [address, setAddress] = useState("");
  let [selectedFiat, setSelectedFiat] = useState("USD");
  const [widget, setWidget] = useState(false);

  const checkTransak =
    selectProvider.value === "Transak" || selectProvider === "Transak";
  const checkSimplex =
    selectProvider.value === "Simplex" || selectProvider === "Simplex";
  const checkUtorg =
    selectProvider.value === "Utorg" || selectProvider === "Utorg";

  if (checkTransak) {
    selectedFiat = "EUR"; //default value
  }

  if (selectProvider.value === "Transak" && !checkCountry && !checkCountry1) {
    Swal.fire({
      icon: "info",
      title: "Oops...",
      html: `<p class="info-style">Sorry, but selected payment processing doesn’t work in your country.<br>Please choose another Payment Provider.</p>`,
    });
    setSelectProvider("");
  }

  // console.log('selectedFiat', selectedFiat)
  const handleChange = (e) => {
    setAddress(e.target.value);
  };

  let valid_address_evm = queryString.parse(parsed.address || address);
  const stringified_valid = queryString.stringify(valid_address_evm);
  valid_address_evm = stringified_valid.substr(0, 2);

  const [selected, setSelected] = useState(
    valid
      ? "VLX(EVM)"
      : parsed.crypto_currency === "VLX" && valid_address_evm === "0x"
      ? "VLX(EVM)"
      : "VLX(NATIVE)" && parsed.crypto_currency === "VLX_USDV"
      ? "VLX(USDV)"
      : "VLX(NATIVE)"
  );
  console.log("selected", selected);

  let total_amount_usd = null;
  let total_amount_eur = null;
  let validate_amount_min_eur = null;
  let validate_amount_max_eur = null; //not included, do it
  let min_fee_eur = null;
  let toAmount, fromAmount, rate_euro;
  let amount_calc, amountCrypto;
  let min_usd_valid = null;
  let min_eur_valid = null;

  const checkMinAmount = () => {
    if (checkSimplex) {
      return 50;
    }
    if (checkTransak) {
      return 30;
    }
    if (checkUtorg) {
      return 50;
    }
  };
  const validate_amount_min_usd = checkMinAmount();
  const validate_amount_max_usd = 20000;
  const min_fee_usd = 10;
  const usdv_price = 1.13;

  if (tickerData) {
    const rate =
      selected === "VLX(USDV)" || parsed.crypto_currency === "VLX_USDV"
        ? usdv_price
        : tickerData[
            valid
              ? "price_usd"
              : parsed.crypto_currency === "VLX"
              ? "price_usd"
              : `${parsed.crypto_currency}_price`
          ];
    // console.log('rate', rate)
    if (rate) {
      total_amount_usd = amount * rate;
    }

    if (tickerEurData) {
      const rate_eur_usd = tickerEurData["USD"]; // coefficient eur/usd (Fixer)
      if (rate_eur_usd) {
        total_amount_eur = total_amount_usd / rate_eur_usd;
        validate_amount_min_eur = validate_amount_min_usd / rate_eur_usd;
        validate_amount_max_eur = validate_amount_max_usd / rate_eur_usd; // not included, do it
        min_fee_eur = 10 / rate_eur_usd;
        rate_euro = rate_eur_usd;
      }
    }
    if (amountInFromCurrency) {
      toAmount = amount;

      fromAmount = (
        selectedFiat === "USD" ? amount * rate : (amount * rate) / rate_euro
      ).toFixed(2);
      if (amountTo) {
        amount_calc = toAmount;
      }
    } else {
      fromAmount = amountFrom;
      toAmount = (
        selectedFiat === "USD"
          ? amountFrom / rate
          : (amountFrom / rate) * rate_euro
      ).toFixed(2);
      if (amountTo) {
        amount_calc = toAmount;
      }
    }

    amountCrypto = amountTo ? amount_calc : amount;

    min_usd_valid = amountCrypto * rate < validate_amount_min_usd;
    min_eur_valid =
      (amountCrypto * rate) / rate_euro < validate_amount_min_usd / rate_euro;
  }

  const handleFromAmountChange = (e) => {
    setAmountFrom(e.target.value);
    setAmountInFromCurrency(false);
    setAmountTo(true);
  };

  const handleToAmountChange = (e) => {
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
    walletAddress: valid ? address : parsed.address,
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
    network: valid
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
    if (checkUtorg && valid && selected === "VLX(EVM)") {
      return "VLXETH";
    }
    if (checkUtorg && valid && selected === "VLX(NATIVE)") {
      return "VLX";
    }
    if (checkUtorg && valid && selected === "VLX(USDV)") {
      return "USDVEL";
    }
    if (valid_address_evm === "0x" && parsed.crypto_currency !== "VLX_USDV") {
      return "VLXETH";
    }
    if (parsed.crypto_currency === "VLX" && valid_address_evm !== "0x") {
      return "VLX";
    }
    if (parsed.crypto_currency === "VLX_USDV") {
      return "USDVEL";
    }
  };
  const typeUtorg = "FIAT_TO_CRYPTO";

  const onSubmitUtorg = () => {
    console.log("type", typeUtorg);
    console.log("currency", validCurrencyForUtorg());
    console.log("paymentCurrency", selectedFiat || parsed.fiat_currency);
    console.log("paymentAmount", fromAmount);
    console.log("externalId", payment_id);
    console.log("address", valid ? address : parsed.address);
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
        <a href={link_wallet} class="active link_btn" target="_blank">
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
  const checkProvider = () => {
    if (selectProvider.value === "Simplex" || selectProvider === "Simplex") {
      return body;
    }

    if (selectProvider.value === "Transak" || selectProvider === "Transak") {
      return body_transak;
    }

    if (selectProvider.value === "Utorg" || selectProvider === "Utorg") {
      return body_utorg;
    }
  };

  const onInfo = () => {
    Swal.fire({
      icon: "info",
      title: title_info,
      html: checkProvider(),
    });
  };

  const options = [
    { value: "Simplex", label: "Simplex (Visa/MC)" },
    { value: "Transak", label: "Transak (Visa/MC)" },
    { value: "Utorg", label: "Utorg (Visa/MC)" },
  ];
  const Provider = (props) => {
    return (
      <div style={props.style}>
        <Form.Label class="left-side-p">
          Pay with {selectProvider.value}
          {selectProvider.value && (
            <BsInfoCircle onClick={onInfo} className="info-icon" />
          )}
        </Form.Label>
        <div className="mb-3">
          <Select
            defaultValue={selectProvider}
            isDisabled={props.default && true}
            onChange={setSelectProvider}
            options={options}
            placeholder={props.default && props.default}
            isOptionDisabled={(option) => option.disabled}
            onInputChange={() => setSelected("VLX(EVM)")}
          />
        </div>
      </div>
    );
  };
  console.log("selectProvider", selectProvider.value);

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

  return (
    <>
      <Form
        className="input-form mt-3"
        method="POST"
        ref={formRef}
        onSubmit={
          selectProvider.value === "Simplex" ? onSubmit : onSubmitTransak
        }
        action={
          SIMPLEX_PAYMENT_URIS[
            window.location.host === "buy.velas.com" ? "mainnet" : "testnet"
          ]
        }
      >
        <motion.div
          className="col-md-10 offset-md-1"
          initial={{ x: "-5vw" }}
          animate={{ x: 0 }}
        >
          <Form.Group>
            <Provider style={{ display: !valid && "none" }} />
            <div id="input-block">
              <span className="fiat-amount" id="input-amount">
                <CurrencyRow
                  onChangeAmount={handleFromAmountChange}
                  amount={fromAmount}
                  placeholder="0.00"
                  label={"Pay"}
                  selectedRow={selectedFiat}
                  setSelectedRow={setSelectedFiat}
                  currency1={"USD"}
                  currency2={"EUR"}
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
                  disabled={!valid && true}
                  disabledItem={!checkUtorg && true}
                />
              </span>
            </div>

            {valid && inputAddress()}

            {selectedFiat && (
              <>
                <div class="row_notice_sub">
                  <p class="left-side-p">Minimum purchase amount:</p>
                  {selectProvider.value || selectProvider ? (
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
                      ~ {selectedFiat === "USD" ? "$" : "€"}
                      {selectedFiat === "USD"
                        ? validate_amount_min_usd
                        : Math.round(validate_amount_min_eur)}{" "}
                      {selectedFiat || parsed.fiat_currency}
                    </p>
                  ) : (
                    <p>...</p>
                  )}
                </div>
                {!valid && (
                  <div class="row_notice_sub">
                    <p class="left-side-p">Pay with:</p>
                    <p class="fee-info">
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
            onClick={
              checkSimplex
                ? onSubmit
                : checkTransak
                ? onSubmitTransak
                : onSubmitUtorg
            }
            disabled={valid_btn}
          >
            {isLoading || widget ? "Loading..." : "Buy"}
          </Button>
          <input type="hidden" name="version" value="1" />
          <input type="hidden" name="partner" value={partner_name} />
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
