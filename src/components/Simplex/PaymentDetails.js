import React, { useState, useMemo, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Form, Button } from "react-bootstrap";
import { motion } from "framer-motion";
import axios from "axios";
import { BASE_API_URL, TICKER_URL } from "../../utils/constants";
import queryString from 'query-string';
import { v4 as uuidv4 } from 'uuid';
import Swal from "sweetalert2";
import EmptyView from "../EmptyView";
import Select from "react-select";

const { address, crypto_currency, env } = queryString.parse(global.location.search);
const partner_name = 'velas';

const fee = 0.00;
const broker_rate = 0.43021295;

const PaymentDetails = (props) => {
  const payment_id = useMemo(uuidv4, []);
  const checkout_url = `${global.location.origin}/simplex/checkout/${encodeURIComponent(payment_id)}/${encodeURIComponent(env)}`;
  const error_url = `${global.location.origin}/simplex/error/${encodeURIComponent(payment_id)}/${encodeURIComponent(env)}`;
  const [tickerData, setTickerData] = useState(null);
  const { user } = props;
  useEffect(() => {
    async function fetchData() {
      const result = await fetch(TICKER_URL);
      setTickerData(await result.json());
    }
    fetchData();
  }, []);
  const { register, handleSubmit, errors } = useForm({
    defaultValues: {
      user_email: user.user_email,
      user_password: user.user_password,
    },
  });
  const [amount, setAmount] = useState("");
  let total_amount = null;
  if (tickerData) {
    const rate = tickerData[crypto_currency === 'VLX' ? 'price_usd' : `${crypto_currency}_price`];
    if (rate) {
      total_amount = amount * rate + 10;
    }
  }
  const formRef = useRef(null);

  const onSubmit = (event) => {
    event.returnValue = false;
    onSubmit_();
    return false;
  }
  const onSubmit_ = async () => {
    console.log('payment_id', payment_id)
    try {
      const frmdetails = {
        amount: amount,
      };
      console.log(frmdetails);

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
        text: e.message,
      });
    }
  };
  const options = [
    { value: 'USD', label: "USD" },
    // { value: 'EUR', label: "EUR" }
  ];

  const [selectedOption, setSelectedOption] = useState(null);
  // console.log('selectedOption', selectedOption.value)
  const SelectFiat = () => {
    return (
      <div className="App">
        <Select
          defaultValue={selectedOption}
          onChange={setSelectedOption}
          options={options}
          isSearchable
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
      onSubmit={handleSubmit(onSubmit)} 
      action="https://sandbox.test-simplexcc.com/payments/new"
    >
      <motion.div
        className="col-md-8 offset-md-2"
        initial={{ x: "-100vw" }}
        animate={{ x: 0 }}
        transition={{ stiffness: 150 }}
      >
        <Form.Group controlId="first_name">
          <Form.Label>Amount:</Form.Label>
          <Form.Control
            type="number"
            name="amount"
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            autoComplete="off"
          />
          <Form.Label style={{marginTop: "10px"}}>Select a fiat:</Form.Label>
        <SelectFiat/>
        </Form.Group>
        {selectedOption && (
          <>
          {/* <p class="title_notice">You are about to receive funds using fiat funds:</p> */}
          <div class="row_notice">
            <p>You will receive:</p>
            <p>{amount} {crypto_currency}</p>
          </div>
          <div class="row_notice">
            <p>Fee:</p>
            <p>10 {selectedOption.value}</p>
          </div>
          { !!total_amount &&
            <div class="row_notice">
              <p>You will send:</p>
              <p>~{total_amount} {selectedOption.value}</p>
            </div>
          }
        <Button variant="primary" 
        // type="submit"
        onClick={onSubmit}
        >
          Next
        </Button>
        </>
        )}

        <input type='hidden' name='version' value='1'/>  
        <input type='hidden' name='partner' value={partner_name}/>
        <input type='hidden' name='payment_flow_type' value='wallet'/>
        <input type='hidden' name='return_url_success' value={checkout_url}/>
        <input type='hidden' name='return_url_fail' value={error_url}/>
        <input type='hidden' name='payment_id' value={payment_id}/>


        {/* <Form.Group controlId="password">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            name="user_password"
            placeholder="Choose a password"
            autoComplete="off"
            ref={register({
              required: 'Password is required.',
              minLength: {
                value: 6,
                message: 'Password should have at-least 6 characters.'
              }
            })}
            className={`${errors.user_password ? 'input-error' : ''}`}
          />
          {errors.user_password && (
            <p className="errorMsg">{errors.user_password.message}</p>
          )}
        </Form.Group> */}

        {/* <Button variant="primary" type="submit">
          Next
        </Button> */}
      </motion.div>
    </Form>
  );
};

export default PaymentDetails;
