import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Form, Button } from "react-bootstrap";
import { motion } from "framer-motion";
import axios from "axios";
import { BASE_API_URL } from "../../utils/constants";
import queryString from 'query-string';
 
const { address, crypto_currency } = queryString.parse(global.location.search);

const PaymentDetails = (props) => {
  const { user } = props;
  const { register, handleSubmit, errors } = useForm({
    defaultValues: {
      user_email: user.user_email,
      user_password: user.user_password,
    },
  });
  const [amount, setAmount] = useState("");

  const onSubmit = () => {
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
    axios.post(`${BASE_API_URL}`, params).then((res) => {
      console.log(res);
      console.log(res.data);
    });

    props.history.push("/third");
  };
  if (!address || !crypto_currency) return null;

  return (
    <Form className="input-form" onSubmit={handleSubmit(onSubmit)}>
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
