import React, { useState, useMemo, useRef, useEffect } from "react";
import { Form, Button, InputGroup, FormControl } from "react-bootstrap";
import { motion } from "framer-motion";
import axios from "axios";
import {
  SIMPLEX_PAYMENT_URIS,
  BASE_API_URL,
  TICKER_URL,
  REDIRECT_URIS,
  TICKER_URL_FIXER
} from "../../utils/constants";
import queryString from "query-string";
import { v4 as uuidv4 } from "uuid";
import Swal from "sweetalert2";
import EmptyView from "../EmptyView";
import InputAmount from "../InputAmount";
import Select from "react-select";

const parsed = queryString.parse(global.location.search);
console.log("parsed", parsed);

let valid_address_evm = queryString.parse(parsed.address);
const stringified_valid = queryString.stringify(valid_address_evm);
valid_address_evm = stringified_valid.substr(0, 2);
const vlx_evm = "VLX-EVM"
const partner_name = "velas";
const valid = !parsed.address && !parsed.crypto_currency && !parsed.env;

const validate_amount_min_usd = 50;
const validate_amount_max_usd = 20000;
const min_fee_usd = 10;

const PaymentDetails = (props) => {
  const payment_id = useMemo(uuidv4, []);
  const checkout_url = `${
    global.location.origin
  }/simplex/checkout/${encodeURIComponent(payment_id)}/${encodeURIComponent(
    parsed.env
  )}`;
  const error_url = `${
    global.location.origin
  }/simplex/error/${encodeURIComponent(payment_id)}/${encodeURIComponent(
    parsed.env
  )}`;
  const [tickerData, setTickerData] = useState(null);
  const [tickerEurData, setTickerEurData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    async function fetchData() {
      const result = await fetch(TICKER_URL);
      setTickerData(await result.json());
    }
    fetchData();
  }, []);
  useEffect(() => {
    async function fetchData() {
      const result1 = await fetch(TICKER_URL_FIXER);
      setTickerEurData(await result1.json());
    }
    fetchData();
  }, []);
  const [amount, setAmount] = React.useState(parsed.crypto_amount ? parsed.crypto_amount : "");
  const [address, setAddress] = React.useState("");
  let total_amount = null;
  let total_amount_eur = null;
  let validate_amount_min_eur = null;
  let validate_amount_max_eur = null;
  let min_fee_eur = null;
  if (tickerData) {
    const rate = tickerData[valid ? "price_usd" : parsed.crypto_currency === "VLX" ? "price_usd" : `${parsed.crypto_currency}_price`];
    if (rate) {
      total_amount = amount * rate;
      // min_amount = (40 / rate) * 1.1;
    }
    if (tickerEurData) {
      const rate1 = tickerEurData["USD"];
      console.log("rate1", rate1);
      if (rate1) {
        total_amount_eur = amount * rate / rate1;
        validate_amount_min_eur = validate_amount_min_usd / rate1;
        validate_amount_max_eur = validate_amount_max_usd / rate1;
        min_fee_eur = 10 / rate1;
      }
    }
  }
  console.log('validate_amount_min_eur', validate_amount_min_eur)
  console.log('validate_amount_max_eur', validate_amount_max_eur)
  const formRef = useRef(null);

  const onSubmit = (event) => {
    event.returnValue = false;
    setIsLoading(false);
    onSubmit_();
    return false;
  };
  const onSubmit_ = async () => {
    console.log("payment_id", payment_id);
    setIsLoading(true);
    try {
      const params = {
        crypto_currency: parsed.crypto_currency ? valid_address_evm === '0x' ? vlx_evm : parsed.crypto_currency : 'VLX',
        fiat_currency: selectedOption.value || parsed.fiat_currency,
        crypto_amount: Number(amount),
        address: valid ? address : parsed.address,
      };
      const quoteResult = await axios.post(`${BASE_API_URL}/quote`, params);

      if (quoteResult.data.error) throw new Error(quoteResult.data.error);

      const paramsPayment = {
        quote_id: quoteResult.data.quote_id,
        address: valid ? address : parsed.address,
        payment_id: payment_id,
        crypto_currency: parsed.crypto_currency ? valid_address_evm === '0x' ? vlx_evm : parsed.crypto_currency : 'VLX',
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
  const options = [
    { value: 'USD', label: "USD" },
    { value: 'EUR', label: "EUR" }
  ];
  const [selectedOption, setSelectedOption] = useState(parsed.fiat_currency ? parsed.fiat_currency : null);
	  const SelectFiat = () => {		
    return (		
	      <div className="mb-3">		
	        <Select		
	          defaultValue={selectedOption}		
	          isDisabled={parsed.fiat_currency && true}		
	          placeholder={parsed.fiat_currency && parsed.fiat_currency}		
	          onChange={setSelectedOption}		
	          options={options}
        />		
	      </div>		
	    );		
	  }
  
  if (!parsed.address || !parsed.crypto_currency) return <EmptyView />;
  return (
    <Form
      className="input-form mt-3"
      method="POST"
      ref={formRef}
      onSubmit={onSubmit}
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
        <Form.Label class="left-side-p">Want to spend currency:</Form.Label>
          <SelectFiat/>
          <Form.Label class="left-side-p">Amount of {parsed.crypto_currency ? parsed.crypto_currency : "VLX"}:</Form.Label>
          <InputGroup className="mb-3">
            <InputAmount
              value={amount}
              onChangeText={(value) => setAmount(value)}
              placeholder={"0.00"}
              maxLength={!selectedOption && 0}
            />
            {selectedOption ? 
            <InputGroup.Text>
              ~ {Number(selectedOption.value === 'USD' ? total_amount : total_amount_eur).toFixed(2)} {selectedOption.value || parsed.fiat_currency}
            </InputGroup.Text> :
            <InputGroup.Text/>
            }
          </InputGroup>
          {
            selectedOption && (
          <>
          <div class="row_notice_sub">
            <p class="left-side-p">Min amount to buy:</p>
            <p class={amount ? selectedOption.value === 'USD' ? total_amount < validate_amount_min_usd ? "red" : null : total_amount_eur < Math.round(validate_amount_min_eur) ? "red" : null : null}>
              {" "}
              {selectedOption.value === 'USD' ? validate_amount_min_usd : Math.round(validate_amount_min_eur)} {selectedOption.value || parsed.fiat_currency}
            </p>
          </div>
          <div class="row_notice_sub">
            <p class="left-side-p">Fee:</p>
            <p>
              3.5% - 5%, min {selectedOption.value === 'USD' ? min_fee_usd : Math.round(min_fee_eur)} {selectedOption.value} {address}
            </p>
          </div>
          </>
            ) 
          }
        </Form.Group>
        <Button
          variant="primary"
          onClick={onSubmit}
          disabled={!amount || (total_amount < validate_amount_min_usd) && (total_amount_eur < Math.round(validate_amount_min_eur))}
        >
          {isLoading ? "Loading..." : "Buy"}
        </Button>
        <input type="hidden" name="version" value="1" />
        <input type="hidden" name="partner" value={partner_name} />
        <input type="hidden" name="payment_flow_type" value="wallet" />
        <input type="hidden" name="return_url_success" value={checkout_url} />
        <input type="hidden" name="return_url_fail" value={error_url} />
        <input type="hidden" name="payment_id" value={payment_id} />
      </motion.div>
    </Form>
  );
};

export default PaymentDetails;
