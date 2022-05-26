import React, { useState, useEffect } from "react";
import { Form, Button } from "react-bootstrap";
import csc from "country-state-city";
import axios from "axios";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import queryString from "query-string";
import io from "socket.io-client";
import { REDIRECT_URIS, UTORG_DOMAIN } from "../../utils/constants";
import Copy from "../../images/copy.svg"
import EmptyView from "../EmptyView";

const [payment_id, env] = global.location.pathname.split("/").slice(4);
console.log({payment_id, env})

const Checkout = (props) => {

  const { crypto_currency, fiat_currency, crypto_amount, address, debug } = props;
  const parsed = queryString.parse(global.location.search);
  const network = parsed.env === "wallet_testnet" ? "testnet" : "mainnet";

  const checkStatus = (status) => {
    switch (status) {
      case "waiting":
        return "Waiting..";
      case "payment_request_submitted":
        return "Payment Submitted!";
      case "payment_approved":
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

  const checkTxConfirmation = function (arg$, cb) {
    const { start, network, tx } = arg$;
    return async function () {
      if (Date.now() > start + 3600000) {
        return cb(
          'Get transaction details timeout has expired. Try to repeat later.'
        );
      }
      const seed = network === 'testnet' ? 'Fhg5x79TFf' : 'VelasWallet';
      const headers = {
        'Content-Type': 'application/json;charset=UTF-8',
        'X-AUTH-SID': seed,
        'X-AUTH-NONCE': Date.now(),
      };
      const params = {
        id: payment_id,
      };
      const uri = UTORG_DOMAIN[`${network}`] + '/api/merchant/v1/order/find';
      const quoteResult = await axios.post(uri, params, {headers});

    };
  };

  const checkTransactionStatus = function (arg$, cb) {
    const { start, network, tx } = arg$;

    const timerCb = function (err, res) {
      clearInterval(checkTransactionStatus.timer);
      return cb(err, res);
    };
    return (checkTransactionStatus.timer = setInterval(
      checkTxConfirmation(
        {
          start: start,
          network: network,
          tx: tx,
        },
        timerCb
      ),
      1000
    ));
  };

  useEffect(() => {
//    checkTransactionStatus({ start: Date.now(), network, tx: payment_id }, function(err, res){
//      if (err) {
//        Swal.fire({
//          icon: "error",
//          title: "Error",
//          text: (err || "").toString(),
//        });
//      } else {
//        Swal.fire({
//          icon: "success",
//          title: "Transaction succeed",
//          text: "Your transaction was succeed",
//        });
//      }
//    })
    setStatus('payment_approved');

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
