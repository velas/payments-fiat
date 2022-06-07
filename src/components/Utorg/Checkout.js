import React, { useState, useEffect } from "react";
import { Form, Button } from "react-bootstrap";
import axios from "axios";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import queryString from "query-string";
import { isAndroid, isIOS } from "react-device-detect";
import { REDIRECT_URIS, UTORG_DOMAIN, UTORG_TX_DETAILS_URI } from "../../utils/constants";
import Copy from "../../images/copy.svg";
import { makeQuery } from "./functions";


const Checkout = (props) => {

  const { crypto_currency, fiat_currency, crypto_amount, address } = props;
  const parsed = queryString.parse(global.location.search);
  const payment_id = parsed.payment_id;
  const network = parsed.env === "wallet_testnet" ? "testnet" : "mainnet";

  const checkStatus = (status) => {
    switch (status) {
      case "waiting":
        return "Waiting..UTORG";
      case "payment_request_submitted":
        return "Payment Submitted!";
      case "payment_approved":
        return "Payment Approved!";
      case "error":
        return "Payment failed!"
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
    if (!payment_id) {
      return;
    }
    return async function () {
      if (Date.now() > start + 3600000) {
        return cb(
          'Get transaction details timeout has expired. Try to repeat later.'
        );
      }

      const params = {
        id: payment_id,
      };
      const res = await makeQuery({ url: UTORG_TX_DETAILS_URI, network, params });
      if (res && res.data && res.data.data) {
        // console.log("[checkTxConfirmation]", res)
        const data = res.data.data[0];
        return cb(null, { id: data.id, status: data.status, blockchainTxId: data.blockchainTxId });
      };
    }
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
      5000
    ));
  };

  useEffect(() => {
    checkTransactionStatus({ start: Date.now(), network, tx: payment_id }, function(err, res){
      if (err) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: (err || "").toString(),
        });
      } else {
        const { id, status , blockchainTxId } = res;
        if (status === "EXECUTED" || status === "SUCCESS") {
          setStatus('payment_approved');
          Swal.fire({
            icon: "success",
            title: "Transaction succeed",
            text: "Your transaction was succeed",
          });
        }
        if (status === "ERROR") {
          setStatus("error");
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Something went wrong during order creation.",
          });
        }
      }
    })

    return () => {
       clearInterval(checkTransactionStatus.timer);
    }
  }, []);

  const goBack = (e) => {
    e.preventDefault();
    if (isAndroid) {
      const url ="intent:/#Intent;scheme=https;package=com.velas.mobile_wallet;end";
      window.location.replace(url);
    } else if (isIOS) {
      window.location.replace("com.velas.walletmobile://");
    } else {
      window.location.replace(parsed.env === undefined ? REDIRECT_URIS.wallet_mainnet : REDIRECT_URIS[parsed.env]);
    }
  }

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
          REDIRECT_URIS[network]
        }
      >
        <motion.div
          className="col-md-8 offset-md-2"
          // initial={{ x: "-5vw" }}
          // animate={{ x: 0 }}
        >
          <Form.Group>
            <div className="block-txt">
              <p className="row-txt status" style={{color: statusColor(status)}}>{checkStatus(status)}</p>
              { status === "EXECUTED" && (
                <p className="row-txt">
                  Go back to the wallet to check your balance!
                </p>
              )}
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
          <Button variant="primary" type="button" onClick={goBack}>
            Go Back
          </Button>
        </motion.div>
      </Form>
  );
};

export default Checkout;
