import React, { useState, useMemo, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Form, Button, InputGroup, Spinner } from "react-bootstrap";
import { motion } from "framer-motion";
import axios from "axios";
import { BASE_API_URL, TICKER_URL, REDIRECT_URIS } from "../../utils/constants";
import queryString from 'query-string';
import { v4 as uuidv4 } from 'uuid';
import Swal from "sweetalert2";
import EmptyView from "../EmptyView";
import Select from "react-select";
import InputAmount from "../InputAmount";
import { formatBalance, formatValue } from "../../utils/format-value";

const { address, crypto_currency, env } = queryString.parse(global.location.search);
const partner_name = 'velas';

const fee = 0.00;
const broker_rate = 0.43021295;
const validate_amount_min = 50;
const validate_amount_max = 20000;

const PaymentDetails = (props) => {
  const payment_id = useMemo(uuidv4, []);
  // payment_id
  console.log('payment_id', payment_id)
  const checkout_url = `${global.location.origin}/simplex/checkout/${encodeURIComponent(payment_id)}/${REDIRECT_URIS[env]}`;
  const error_url = `${global.location.origin}/simplex/error/${encodeURIComponent(payment_id)}/${REDIRECT_URIS[env]}`;
  const [tickerData, setTickerData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    async function fetchData() {
      const result = await fetch(TICKER_URL);
      setTickerData(await result.json());
    }
    fetchData();
  }, []);
// debugger;
  const [amount, setAmount] = React.useState('');
  let total_amount = null;
  if (tickerData) {
    const rate = tickerData[crypto_currency === 'VLX' ? 'price_usd' : `${crypto_currency}_price`];
    console.log('rate', rate)
    console.log('amount', amount)
    if (rate) {
      // total_amount = amount * rate + 10;
      total_amount = amount * rate + (amount*5/100);
    }
  }
  const formRef = useRef(null);

  const onSubmit = (event) => {
    event.returnValue = false;
    setIsLoading(false);
    onSubmit_();
    return false;
  }
  const onSubmit_ = async () => {
    console.log('payment_id', payment_id)
    setIsLoading(true);
    try {
      const params = {
        crypto_currency: crypto_currency,
        fiat_currency: selectedOption.value,
        crypto_amount: Number(amount),
        address: address,
      };
      const quoteResult = await axios.post(`${BASE_API_URL}/quote`, params);
      
      if (quoteResult.data.error) throw new Error(quoteResult.data.error);
          
      const paramsPayment = {
        quote_id: quoteResult.data.quote_id,
        address: address,
        payment_id: payment_id,
        crypto_currency: crypto_currency
      }

      const paymentResult = await axios.post(`${BASE_API_URL}/payment`, paramsPayment);
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
    { value: 'EUR', label: "EUR", disabled: true }
  ];

  const [selectedOption, setSelectedOption] = useState(null);
  // console.log('selectedOption', selectedOption.value)
  const SelectFiat = () => {
    return (
      <div className="App">
        <Select
          defaultValue={selectedOption}
          // isDisabled
          // placeholder
          onChange={setSelectedOption}
          options={options}
          isSearchable
          isOptionDisabled={(option) => option.disabled}
        />
      </div>
    );
  }
  if (!address || !crypto_currency) return <EmptyView/>;

  return (
    <Form 
      className="input-form" 
      method="POST"
      ref={formRef} 
      onSubmit={onSubmit} 
      action="https://sandbox.test-simplexcc.com/payments/new"
    >
      <motion.div
        className="col-md-8 offset-md-2"
        initial={{ x: "-5vw" }}
        animate={{ x: 0 }}
      >
        <Form.Group>
          <Form.Label>Want to get:</Form.Label>
            <InputGroup className="mb-2">
            <InputAmount
            value={amount}
            onChangeText={(value) => setAmount(value)}
            placeholder={"0.00"}
            />
            <InputGroup.Text>{crypto_currency}</InputGroup.Text>
      </InputGroup>

          <Form.Label style={{marginTop: "10px"}}>Want to spend currency:</Form.Label>
        <SelectFiat/>
        </Form.Group>
        {amount && selectedOption && (
          <>
          <div class="row_notice">
            <p>You will receive:</p>
            <p>{formatBalance(Number(amount))} {crypto_currency}</p>
          </div>
          <div class="row_notice">
            <p>Fee:</p>
            <p>3.5% - 5%, min 10 {selectedOption.value}</p>
          </div>
          
        {total_amount < validate_amount_min && <p className="errorMsg">Transaction amount too low. Please enter a value of {validate_amount_min} {selectedOption.value} or more.</p> }
        {total_amount > validate_amount_max && <p className="errorMsg">Transaction amount too high. Please enter a value of {validate_amount_max} {selectedOption.value} or less.</p> }
        </>
        )}
        <Button variant="primary" onClick={onSubmit} 
        disabled={!amount || !selectedOption && true}
        >
          {isLoading ? "Loading...":"Next"}
        </Button>
        <input type='hidden' name='version' value='1'/>  
        <input type='hidden' name='partner' value={partner_name}/>
        <input type='hidden' name='payment_flow_type' value='wallet'/>
        <input type='hidden' name='return_url_success' value={checkout_url}/>
        <input type='hidden' name='return_url_fail' value={error_url}/>
        <input type='hidden' name='payment_id' value={payment_id}/>
      </motion.div>
    </Form>
  );
};

export default PaymentDetails;
