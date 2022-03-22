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
import { isAndroid, isIOS } from "react-device-detect";
import AppleIcon from '../../images/apple.svg';
import GoogleIcon from '../../images/android.svg';

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
      case "PROCESSING":
        return "Test";
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

  const goBack = () => {
    if (isAndroid) {
      const url ="intent:/#Intent;scheme=https;package=com.velas.mobile_wallet;end";
      window.location.replace(url);
    } else if (isIOS) {
      window.location.replace("com.velas.walletmobile://");
    } else {
      window.location.replace(env === 'undefined' ? REDIRECT_URIS.wallet_mainnet : REDIRECT_URIS[env]);
    }
  }
  const validMobile = isIOS || isAndroid;
  const installAndroid = 'https://play.google.com/store/apps/details?id=com.velas.mobile_wallet';
  const installIos = 'https://apps.apple.com/ua/app/velas-mobile-wallet/id1541032748';
  const uriInstallApp = isAndroid ? installAndroid : installIos;
  return (
      <Form
        className="input-form"
        // action={env === 'undefined' ? REDIRECT_URIS.wallet_mainnet : REDIRECT_URIS[env]}
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
          <Button variant="primary" type='button' onClick={goBack} id='btn-go-back'>
            Back to {validMobile ? "App" : "Wallet"}
          </Button>
          {validMobile &&
          <a className='button-store' href={uriInstallApp} >
            <img src={isAndroid ? GoogleIcon : AppleIcon} width={100} height={50}/>
          </a>
          }
        </motion.div>
      </Form>
  );
};

export default Checkout;
