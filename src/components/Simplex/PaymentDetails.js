import React, { useState, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { Form, Button } from "react-bootstrap";
import { motion } from "framer-motion";
import axios from "axios";
import { BASE_API_URL } from "../../utils/constants";
import queryString from 'query-string';
import { v4 as uuidv4 } from 'uuid';
import Swal from "sweetalert2";
import EmptyView from "../EmptyView";

const { address, crypto_currency } = queryString.parse(global.location.search);
const partner_name = 'velas';

const PaymentDetails = (props) => {
  const payment_id = useMemo(uuidv4, []);
  const checkout_url = `http://localhost:3000/simplex/checkout?payment_id=${encodeURIComponent(payment_id)}&address=${address}`;
  const error_url = `http://localhost:3000/simplex/error?payment_id=${encodeURIComponent(payment_id)}&address=${address}`;
  
  const { user } = props;
  const { register, handleSubmit, errors } = useForm({
    defaultValues: {
      user_email: user.user_email,
      user_password: user.user_password,
    },
  });
  const [amount, setAmount] = useState("");
  const formRef = useRef(null);

  const onSubmit = (event) => {
    event.returnValue = false;
    onSubmit_();
    return false;
  }
  const onSubmit_ = async () => {
  console.log('payment_id', payment_id)

    const frmdetails = {
      amount: amount,
    };
    console.log(frmdetails);

    const params = {
      crypto_currency: crypto_currency,
      fiat_currency: "USD",
      crypto_amount: Number(amount),
      address: address,
    };
    const quoteResult = await axios.post(`${BASE_API_URL}/quote`, params);
    
    if (quoteResult.error) throw new Error(quoteResult.error);
        
    const paramsPayment = {
      quote_id: quoteResult.data.quote_id,
      address: address,
      payment_id: payment_id,
      crypto_currency: crypto_currency
    }
    const paymentResult = await axios.post(`${BASE_API_URL}/payment`, paramsPayment);
    if (paymentResult.error) throw new Error(paymentResult.error);

    formRef.current.submit();
  };
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
        </Form.Group>
        

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

        <Button variant="primary" type="submit">
          Next
        </Button>
      </motion.div>
    </Form>
  );
};

export default PaymentDetails;
