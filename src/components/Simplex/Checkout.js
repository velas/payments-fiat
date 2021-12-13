import React, { useState, useEffect } from "react";
import { Form, Button } from "react-bootstrap";
import csc from "country-state-city";
import axios from "axios";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import queryString from "query-string";
import io from "socket.io-client";
import { REDIRECT_URIS } from "../../utils/constants";
import Copy from "../../images/copy.svg"

const [payment_id, env] = global.location.pathname.split("/").slice(3);

const socket = io("/", {
  query: {
    query: "v1/simplex/status",
    payment_id: payment_id,
  },
});
const Checkout = (props) => {
  const checkStatus = (status) => {
    switch (status) {
      case "waiting":
        return "Waiting..";
      case "payment_request_submitted":
        return "Payment Submitted!";
      case "payment_simplexcc_approved":
        return "Payment Approved!";
      default:
        return null;
    }
  };
  const statusColor = (status) => {
    switch (status) {
      case "waiting":
        return "orange";
      default:
        return "#0bffbf";
    }
  };
  const [status, setStatus] = useState("waiting");
  useEffect(() => {
    const onPaymentUpdate = (event) => {
      setStatus(event.name);
      socket.emit("processed", { event_id: event.event_id });
    };
    socket.on("update", onPaymentUpdate);
    return () => {
      socket.off("update", onPaymentUpdate);
    };
  }, []);
  const copyPaymentId = () => {
    navigator.clipboard.writeText(payment_id)
    Swal.fire({
      icon: "success",
      title: "Copied",
      text: payment_id,
    });
  }
  return (
      <Form
        className="input-form"
        action={
          REDIRECT_URIS[env]
        }
      >
        <motion.div
          className="col-md-8 offset-md-2"
          initial={{ x: "-5vw" }}
          animate={{ x: 0 }}
        >
          <Form.Group>
            <div className="block-txt">
              <p className="row-txt status" style={{color: statusColor(status)}}>{checkStatus(status)}</p>
              <p className="row-txt">
                Go back to the wallet to check your balance!
              </p>
            </div>
            <div className="block-txt">
              <p className="row-txt">Your payment id:</p>
              <p className="row-txt payment_id" onClick={copyPaymentId}>
                {payment_id} 
                <img 
                  src={Copy} 
                  alt="Copy" 
                  id="copy"
                  className="copyIcon" 
                />
              </p>
            </div>
          </Form.Group>
          <Button variant="primary" type="submit">
            Go Back
          </Button>
        </motion.div>
      </Form>
  );
};

export default Checkout;
