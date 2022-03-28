import React, { useState, useMemo, useRef, useEffect } from "react";
import { Form, Button, InputGroup, FormControl, DropdownButton, Dropdown } from "react-bootstrap";
import { motion } from "framer-motion";
import axios from "axios";
import {
  SIMPLEX_PAYMENT_URIS,
  BASE_API_URL,
  TICKER_URL,
  REDIRECT_URIS,
  TICKER_URL_FIXER,
  TRANSAK_PAYMENT_URIS
} from "../../utils/constants";
import queryString from "query-string";
import { v4 as uuidv4 } from "uuid";
import Swal from "sweetalert2";
import EmptyView from "../EmptyView";
import Select from "react-select";
import { BsInfoCircle } from "react-icons/bs";
import transakSDK from '@transak/transak-sdk'
import useGeoLocation from "react-ipgeolocation";
 
const parsed = queryString.parse(global.location.search);
// console.log('parsed', parsed)
const vlx_evm = "VLX-EVM"
const partner_name = "velas";
const valid = !parsed.address && !parsed.crypto_currency && !parsed.env;
const link_wallet = 'https://wallet.velas.com/'

const title_info = `<h2 class="info-style-title">Buying Crypto with your Credit Card</h2>`;
const body = `<p class="info-style">The minimum transaction is $50 USD, and the maximum is $20,000 USD.<br> These limits are set by the provider. We do not collect any fees. The provider charges a conversion and network fee. <br>Fees range between 3.5% - 5% depends on transaction value. Notice that the provider applies a minimum fee of $10 USD per transaction needed to ensure processing.</p>`;
const body_transak = `<p class="info-style">The minimum amount is $30 USD **, limit per transaction is $1,500 USD, daily limit per user is $14,000 USD, monthly limit per user is $28,000 USD, and yearly limit per user is $100,000 USD.
<br>These limits are set by the provider. We do not charge any commissions.
<br>Provider fee is 3.5%.<br><br>** For some cryptocurrencies our minimum buy amount may be greater due the minimum withdrawal limit of our partner exchanges.</p>`;


const CurrencyRow = ({
  onChangeAmount,
  amount,
  placeholder,
  label,
  selected,
  setSelected,
  currency1,
  currency2,
  disabled
}) => {
  return (
      <>
    <Form.Label class="left-side-p">{label}</Form.Label>
    <InputGroup >
      <FormControl
        value={amount}
        onChange={onChangeAmount}
        placeholder={placeholder}
        type="number"
      />
      <DropdownButton
        title={selected}
        id="dropdown-fiat"
        disabled={disabled}
      >
      <Dropdown.Item style={{fontSize: 12}} href="#" active={selected === currency1 && true} onSelect={() => setSelected(currency1)}>{currency1}</Dropdown.Item>
      <Dropdown.Item style={{fontSize: 12}} href="#" active={selected === currency2 && true} onSelect={() => setSelected(currency2)}>{currency2}</Dropdown.Item>
      </DropdownButton>
      </InputGroup>
      </>
  );
}

const PaymentDetails = (props) => {
  const payment_id = useMemo(uuidv4, []);
  const checkout_url = `${global.location.origin}/provider/checkout/${encodeURIComponent(payment_id)}/${encodeURIComponent(parsed.env)}`;
  const error_url = `${global.location.origin}/provider/error/${encodeURIComponent(payment_id)}/${encodeURIComponent(parsed.env)}`;
  const [tickerData, setTickerData] = useState(null);
  const [tickerEurData, setTickerEurData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectProvider, setSelectProvider] = useState("")
  const [amountInFromCurrency, setAmountInFromCurrency] = React.useState(true);
  
  const location = useGeoLocation();
  // console.log('location', location.country);
  //3.5%, remove UA
  const countries = ["UA", "AT", "BE", "CY", "EE", "FI", "FR", "DE", "GR", "IE", "IT", "LV", "LU", "MT", "NL", "PT", "ES", "SK", "LT", "GB", "CZ", "SI", "MC"];
  //5.5%
  const countries1 = ["AU", "CA", "DK", "NZ", "NO", "PL", "SI", "SE", "CH", "AR", "BR", "CL", "CR", "DO", "IS", "ID", "IL", "JP", "MY", "PY", "PE", "PH", "SG", "ZA", "KR", "TH", "TR", "BM", "BG", "HR", "CZ", "FK", "FJ", "GI", "HU", "JM", "KE", "MD", "RO", "MX", "TZ"];

  function checkArray(arr, val) {
    return arr.some(function(arrVal) {
      return val === arrVal;
    });
  }
  function checkArray1(arr, val) {
    return arr.some(function(arrVal) {
      return val === arrVal;
    });
  }
  const checkCountry = checkArray(countries, location.country);
  const checkCountry1 = checkArray1(countries1, location.country);

  let check_provider;
    if (!valid) {
      function checkProvider() {
        const parsed = queryString.parse(global.location.search);
        check_provider = parsed.provider;
        setSelectProvider(check_provider)
        // console.log('check_provider', check_provider)
      }
      setTimeout(checkProvider, 500);
    }

    // console.log('selectProvider', selectProvider)
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
  
  

  const [amount, setAmount] = useState(300); // default value
  const [amountFrom, setAmountFrom] = useState('');
  const [amountTo, setAmountTo] = useState('');
  const [address, setAddress] = useState('');
  let [selectedFiat, setSelectedFiat] = useState('USD');
  const [widget, setWidget] = useState(false);

  const checkTransak = selectProvider.value === 'Transak' || selectProvider === 'Transak';
  const checkSimplex = selectProvider.value === 'Simplex' || selectProvider === 'Simplex';
  if (checkTransak) {
     selectedFiat = 'EUR' //default value
  }

  if (selectProvider.value === 'Transak' && !checkCountry && !checkCountry1) {
      Swal.fire({
        icon: "info",
        title: "Oops...",
        html: `<p class="info-style">Sorry, but selected payment processing doesn’t work in your country.<br>Please choose another Payment Provider.</p>`,
      });
      setSelectProvider('');
  }
 
  // console.log('selectedFiat', selectedFiat)
  const handleChange = e => {
    setAddress(e.target.value);
  }
  
  let valid_address_evm = queryString.parse(parsed.address || address);
  const stringified_valid = queryString.stringify(valid_address_evm);
  valid_address_evm = stringified_valid.substr(0, 2);

  // const [selected, setSelected] = useState(valid ? 'VLX(NATIVE)' : valid_address_evm === '0x' ? 'VLX(EVM)' : 'VLX');
  const [selected, setSelected] = useState(valid ? 'VLX(EVM)' : valid_address_evm === '0x' ? 'VLX(EVM)' : 'VLX(NATIVE)');

  let total_amount_usd = null;
  let total_amount_eur = null;
  let validate_amount_min_eur = null;
  let validate_amount_max_eur = null; //not included, do it
  let min_fee_eur = null;
  let toAmount, fromAmount, rate_euro;
  let amount_calc, amountCrypto;
  let min_usd_valid = null;
  let min_eur_valid = null;

  const validate_amount_min_usd = selectProvider.value === 'Simplex' ? 50 : 30;
  const validate_amount_max_usd = 20000;
  const min_fee_usd = 10;

  if (tickerData) {
    const rate = tickerData[valid ? "price_usd" : parsed.crypto_currency === "VLX" ? "price_usd" : `${parsed.crypto_currency}_price`];
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
        fromAmount = (selectedFiat === "USD" ? amount * rate : amount * rate / rate_euro).toFixed(2);
        if (amountTo) {
          amount_calc = toAmount;
        }
      } else {
        fromAmount = amountFrom;
        toAmount = (selectedFiat === "USD" ? amountFrom / rate : amountFrom / rate * rate_euro).toFixed(2);
        if (amountTo) {
          amount_calc = toAmount;
        }
      }

    amountCrypto = amountTo ? amount_calc : amount
    
    min_usd_valid = amountCrypto * rate < validate_amount_min_usd;
    min_eur_valid = amountCrypto * rate / rate_euro < validate_amount_min_usd / rate_euro;
  }

  const handleFromAmountChange = e => {
    setAmountFrom(e.target.value);
    setAmountInFromCurrency(false);
    setAmountTo(true)
  };

  const handleToAmountChange = e => {
    setAmount(e.target.value);
    setAmountInFromCurrency(true);
    setAmountTo(false);
  };
  
  const formRef = useRef(null);
  
  let transak = new transakSDK({
    apiKey: TRANSAK_PAYMENT_URIS[window.location.host === "buy.velas.com" ? "mainnet" : "testnet"],
    environment: window.location.host === "buy.velas.com" ? 'PRODUCTION' : 'STAGING',
    walletAddress: valid ? address : parsed.address,
    themeColor: '#0037c1',
    fiatCurrency: 'EUR',
    email: '',
    hostURL: window.location.origin,
    widgetHeight: '600px',
    widgetWidth: '100%',
    hideMenu: true,
    fiatAmount: fromAmount,
    defaultPaymentMethod: 'credit_debit_card',
    disablePaymentMethods: 'sepa_bank_transfer, gbp_bank_transfer, apple_pay',
    network: valid ? selected === "VLX(EVM)" ? 'velasevm' : 'mainnet' : parsed.crypto_currency && valid_address_evm === '0x' ? 'velasevm' : 'mainnet',//velasevm or mainnet
    defaultCryptoCurrency: 'VLX',
    cryptoCurrencyCode: 'VLX',
    disableWalletAddressForm: true,
  });

  // transak.on(transak.ALL_EVENTS, (data) => {
  //     console.log(data)
  // });

  transak.on(transak.EVENTS.TRANSAK_WIDGET_OPEN, (data) => {
    setWidget(true);
  });
  transak.on(transak.EVENTS.TRANSAK_WIDGET_CLOSE, (data) => {
    setWidget(false);
  });

  transak.on(transak.EVENTS.TRANSAK_ORDER_SUCCESSFUL, (data) => {
    // console.log('data', data.status.status);
    transak.close();
    window.location.href = `${global.location.origin}/provider/checkout/${encodeURIComponent(data.status.id)}/${encodeURIComponent(parsed.env)}/${encodeURIComponent(data.status.status)}`;
  });
  transak.on(transak.EVENTS.TRANSAK_ORDER_FAILED, (data) => {
    transak.close();
    window.location.href = `${global.location.origin}/provider/checkout/${encodeURIComponent(data.status.id)}/${encodeURIComponent(parsed.env)}/${encodeURIComponent(data.status.status)}`;
  });
  transak.on(transak.EVENTS.TRANSAK_ORDER_CANCELLED, (data) => {
    transak.close();
    window.location.href = `${global.location.origin}/provider/checkout/${encodeURIComponent(data.status.id)}/${encodeURIComponent(parsed.env)}/${encodeURIComponent(data.status.status)}`;
  });

  const onSubmitTransak = () => {
    transak.init();
  }
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
        crypto_currency: valid ? selected === "VLX(EVM)" ? "VLX-EVM" : "VLX" : parsed.crypto_currency && valid_address_evm === '0x' ? vlx_evm : parsed.crypto_currency,
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
        crypto_currency: valid ? selected === "VLX(EVM)" ? "VLX-EVM" : "VLX"  : parsed.crypto_currency && valid_address_evm === '0x' ? vlx_evm : parsed.crypto_currency
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
    const [focusInput, setFocusInput] = useState(false);
    const handleChangeValid = () => {
      setFocusInput(true);
    }

    const validForm = !address || selected === "VLX(EVM)" && valid_address_evm != '0x' || selected === "VLX(NATIVE)" && valid_address_evm === '0x' || valid && selected === "VLX(EVM)" && address.length < 42 || valid && selected === "VLX(NATIVE)" && address.length < 44;

    const inputAddress = () => {
      return (
        <>
          <Form.Label class="left-side-p">{selected} address</Form.Label>
            <a href={link_wallet} class="active link_btn" target='_blank'>Don't have one?</a>
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
      )
    }

    const onInfo = () => {
      Swal.fire({
        icon: "info",
        title: title_info,
        html: selectProvider.value === 'Simplex' ? body : body_transak,
      });
    };

    const options = [
    { value: 'Simplex', label: "Simplex (Visa/MC)" },
    { value: 'Transak', label: "Transak (Visa/MC)", disabled: parsed.test_mode ? false : true }
    ];
	  const Provider = (props) => {		
      return (		
        <div style={props.style}>
          <Form.Label class="left-side-p">Pay with {selectProvider.value}{selectProvider.value && <BsInfoCircle onClick={onInfo} className="info-icon" />}</Form.Label>
            <div className="mb-3">		
              <Select		
                defaultValue={selectProvider}		
                isDisabled={props.default && true}		
                onChange={setSelectProvider}		
                options={options}
                placeholder={props.default && props.default}
                isOptionDisabled={(option) => option.disabled}
              />	
            </div>	
        </div>	
      );		
	  }
    
  const valid_btn = amountCrypto <=0 || valid && !address || selected === "VLX(EVM)" && valid_address_evm != '0x' || selected === "VLX(NATIVE)" && valid_address_evm === '0x' || min_usd_valid || min_eur_valid || valid && selected === "VLX(EVM)" && address.length < 42 || valid && selected === "VLX(NATIVE)" && address.length < 44 || valid && !selectProvider.value || widget;
  
  if (!valid && !parsed.address || !valid && !parsed.crypto_currency) return <EmptyView />;

  // console.log('selectProvider', selectProvider)
  // console.log('selectProvider.value', selectProvider.value)
  return (
    <>
    <Form
      className="input-form mt-3"
      method="POST"
      ref={formRef}
      onSubmit={selectProvider.value === 'Simplex' ? onSubmit : onSubmitTransak}
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
        <Provider style={{display: !valid && "none"}}/>
        <div id='input-block'>
        <span style={{marginRight: "20px"}} id='input-amount'>
          <CurrencyRow
            onChangeAmount={handleFromAmountChange}
            amount={fromAmount}
            placeholder="0.00"
            label={'Pay'}
            selected={selectedFiat}
            setSelected={setSelectedFiat}
            currency1={'USD'}
            currency2={'EUR'}
            disabled={checkTransak && true}
          />
          </span>
          <span id='input-amount'>
          <CurrencyRow
            onChangeAmount={handleToAmountChange}
            amount={toAmount}
            placeholder="0.00"
            label={'Receive'}
            selected={selected}
            setSelected={setSelected}
            currency1={'VLX(EVM)'}
            currency2={'VLX(NATIVE)'}
            disabled={!valid && true}
          />
          </span>
        </div>

        {valid && inputAddress()}

          {
            selectedFiat && (
          <>
          <div class="row_notice_sub">
            <p class="left-side-p">Minimum purchase amount:</p>
            {selectProvider.value || selectProvider ?
            <p class={amount ? selectedFiat === 'USD' ? min_usd_valid ? "red" : null : min_eur_valid ? "red" : null : null}>
              {" "}
              ~ {selectedFiat === 'USD' ? '$' : '€' }{selectedFiat === 'USD' ? validate_amount_min_usd : Math.round(validate_amount_min_eur)} {selectedFiat || parsed.fiat_currency}
            </p>
            : <p>...</p>}
          </div>
          <div class="row_notice_sub">
            <p class="left-side-p">Fee:</p>
            {!selectProvider.value && !selectProvider ? <p>...</p> :
              (checkSimplex 
                ? 
                <p class='fee-info'>
                3.5%-5% <br/>
                (minimum {selectedFiat === 'USD' ? '$' : '€' }{selectedFiat === 'USD' ? min_fee_usd : Math.round(min_fee_eur)} {selectedFiat})
                </p>
              :
                checkCountry ? <p class='fee-info'>3.5%</p> : <p class='fee-info'>5.5%</p>
              )
            }
          </div>
          </>
            ) 
        }
        </Form.Group>

        <Button
          variant="primary"
          onClick={checkSimplex ? onSubmit : onSubmitTransak}
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
    ) 
};

export default PaymentDetails;
