import React, { useState, useEffect } from "react";
import { Form, Button } from "react-bootstrap";
import csc from "country-state-city";
import axios from "axios";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import queryString from 'query-string';
import io from "socket.io-client";
import { BASE_API_URL } from "../../utils/constants";

const { address, payment_id, env } = queryString.parse(global.location.search);
const socket = io("/", {
  query: {
    "query": "v1/simplex/status",
    "payment_id": payment_id,
  }
});
const Checkout = (props) => {
  const [status, setStatus] = useState("waiting");
  useEffect(() => {
    const onPaymentUpdate = (event) => {
      
    };
    socket.on("update", onPaymentUpdate);
    return () => {
      socket.off("update", onPaymentUpdate);
    };
  }, []);

  return (
    <>
      <Form className="input-form" action="https://wallet.velas.com/">
      <motion.div
        className="col-md-8 offset-md-2"
        initial={{ x: '-100vw' }}
        animate={{ x: 0 }}
        transition={{ stiffness: 150 }}
      >
          <Form.Group>
            <div className="empty-view">
              <p className="wrong-txt">Congratulations!</p>
              <p className="wrong-txt">
                Go back to the wallet to check your balance!
              </p>
            </div>

          </Form.Group>
            <Button variant="primary" type="submit">
              Go Back
            </Button>
        </motion.div>
      </Form>
    </>
  );
};

export default Checkout;
