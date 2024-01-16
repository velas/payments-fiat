import React, { useState } from "react";
import { Form, Button } from "react-bootstrap";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import { REDIRECT_URIS } from "../../utils/constants";
import Copy from "../../images/copy.svg"
import { isAndroid, isIOS } from "react-device-detect";
import AppleIcon from '../../images/apple.svg';
import GoogleIcon from '../../images/android.svg';
import queryString from "query-string";
import Pusher from 'pusher-js';

const parsed = queryString.parse(global.location.search);

const TRANSAK_ORDER_ID = parsed.orderId;
const TRANSAK_STATUS_URL = parsed.status;

const TransakCheckout = (props) => {
  const checkStatus = (status) => {
    switch (status) {
      case "waiting":
        return TRANSAK_STATUS_URL;
      case "ORDER_PROCESSING":
        return "We are processing your order";
      case "ORDER_FAILED":
        return "Payment Failed!";
      case "ORDER_COMPLETED":
        return "Payment Completed!";
      default:
        return null;
    }
  };
  
  const [status, setStatus] = useState("waiting");

// WebSocket
  let pusher = new Pusher('1d9ffac87de599c61283', {cluster: 'ap2'});
  let orderId = TRANSAK_ORDER_ID;
  pusher.subscribe(orderId);
  pusher.bind_global((eventId) => {
    // console.log('eventId', eventId);
    setStatus(eventId);
  });

  
  const copyPaymentId = () => {
    navigator.clipboard.writeText(TRANSAK_ORDER_ID)
    Swal.fire({
      icon: "success",
      title: "Copied",
      text: TRANSAK_ORDER_ID,
    });
  }

  const goBack = () => {
    if (isAndroid) {
      const url ="intent:/#Intent;scheme=https;package=com.velas.mobile_wallet;end";
      window.location.replace(url);
    } else if (isIOS) {
      window.location.replace("com.velas.walletmobile://");
    } else {
      window.location.replace(REDIRECT_URIS.wallet_mainnet);
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
          className="col-md-10 offset-md-1"
          style={{zIndex: 2, marginTop: 20}}
        >
          <Form.Group>
            <div className="block-txt">
              <p className="row-txt status" >{checkStatus(status)}</p>
              <p className="row-txt">
                Go back to the wallet to check your balance!
              </p>
            </div>
            <div className="block-txt">
              <p className="row-txt">Your payment id:</p>
              <p className="row-txt payment_id" onClick={copyPaymentId}>
                {TRANSAK_ORDER_ID} 
                <img 
                  src={Copy} 
                  alt="Copy icon"
                  id="copy"
                  className="copyIcon" 
                />
              </p>
            </div>
          </Form.Group>
          <Button variant="primary buy-button" type='button' onClick={goBack} id='btn-go-back'>
            Back to {validMobile ? "App" : "Wallet"}
          </Button>
          {validMobile &&
          <a className='button-store' href={uriInstallApp} >
            <img
              alt="mobile icon"
              src={isAndroid ? GoogleIcon : AppleIcon}
              width={100}
              height={50}/>
          </a>
          }
        </motion.div>
      </Form>
  );
};

export default TransakCheckout;
