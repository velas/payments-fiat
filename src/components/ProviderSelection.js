import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Form, Button } from "react-bootstrap";
import { motion } from "framer-motion";
import queryString from "query-string";
import EmptyView from "./EmptyView";
import SimplexLogo from "../images/simplex.svg";
import RampLogo from "../images/ramp.svg";
import MoonPay from "../images/moonpay.svg";
import Swal from "sweetalert2";
import { BsInfoCircle } from "react-icons/bs";

const { address, crypto_currency, env } = queryString.parse(
  global.location.search
);

const body_info = (info) => {
  switch (info) {
    case "Simplex":
      return `<p class="info-style">The minimum transaction is $50 , and the maximum is $2,000.<br> These limits are set by the provider. We do not collect any fees. The provider charges a conversion and network fee. <br>Fees range between 3.5% - 5% depends on transaction value. Notice that the provider applies a minimum fee of 10 USD per transaction needed to ensure processing.</p>`;
    case "Ramp":
      return "Ramp empty info";
    case "Moonpay":
      return "Moonpay empty info";
    default:
      return null;
  }
};
const title_info = `<h2 class="info-style-title">Buying Crypto with your Credit Card</h2>`

const ProviderSelection = (props) => {
  const onSubmit = () => {
      props.history.push(`/simplex/2?address=${encodeURIComponent(address)}&crypto_currency=${encodeURIComponent(crypto_currency)}&env=${encodeURIComponent(env)}`);
  };

  const [selectedOption, setSelectedOption] = useState(null);

  if (!address || !crypto_currency || !env) return <EmptyView />;
  const onlyOne = (event) => {
    console.log("Provider", event.target.value);
    setSelectedOption(event.target.value);
  };

  const onInfo = () => {
    Swal.fire({
      icon: 'info',
      title: title_info,
      html: body_info(selectedOption)
    });
  }


  const iconProvider = (status) => {
    switch (status) {
      case "Simplex":
        return <img
        src={SimplexLogo}
        alt="Simplex Logo"
        className="partnerLogo"
      />;
      case "Ramp":
        return <img 
        src={RampLogo} 
        alt="Ramp Logo" 
        className="partnerLogo" 
      />;
      case "Moonpay":
        return <img 
        src={MoonPay} 
        alt="MoonPay Logo" 
        className="partnerLogo" 
      />;
      default:
        return null;
    }
  };

  return (
    <Form className="input-form" onSubmit={onSubmit}>
      <motion.div
      className="col-md-8 offset-md-2"
      initial={{ x: "-5vw" }}
      animate={{ x: 0 }}
      >
        <div class="row_notice">
          <p>Currency to buy:</p>
          <p>{crypto_currency}</p>
        </div>
        <div class="row_notice">
          <p>Pay with:</p>
          <span className="icon_provider">
          <p>{iconProvider(selectedOption)}</p>
          <p>{selectedOption}</p>
          {selectedOption && <BsInfoCircle onClick={onInfo} className='info-icon'/>}
          </span>
        </div>
        <div style={{ display: "grid", marginTop: 10, marginBottom: 10 }}>
          <div>
            <input
              className="custom-radio"
              type="radio"
              name="check"
              value="Simplex"
              onClick={onlyOne}
              checked={selectedOption === "Simplex" ? true : false}
              id={"simplex"}
            />
            <label htmlFor={"simplex"}>
              <img
                src={SimplexLogo}
                alt="Simplex Logo"
                className="partnerLogo"
              />
              <div className="label-provider">
              <span>Simplex(Visa/MC)</span>
              <span className="subtitle-label">(fee 3.5% - 5%, min fee 10 usd)</span>
              </div>
            </label>
          </div>
          <div style={{filter: 'sepia(0.6) opacity(0.4)'}}>
            <input disabled
              className="disabled"
              type="radio"
              name="check"
              value="Ramp"
              onClick={onlyOne}
              checked={selectedOption === "Ramp" ? true : false}
              id={"ramp"}
            />
            <label htmlFor={"ramp"}>
              <img 
                src={RampLogo} 
                alt="Ramp Logo" 
                className="partnerLogo" 
              />
              <div className="label-provider">
              <span title="Not connected">Ramp</span>
              <span className="subtitle-label">(fee 6%)</span>
              </div>
            </label>
          </div>
          <div style={{filter: 'sepia(0.6) opacity(0.4)'}}>
            <input disabled
              className="disabled"
              type="radio"
              name="check"
              value="Moonpay"
              onClick={onlyOne}
              checked={selectedOption === "Moonpay" ? true : false}
              id={"moonpay"}
            />
            <label htmlFor={"moonpay"}>
              <img 
                src={MoonPay} 
                alt="MoonPay Logo" 
                className="partnerLogo" 
              />
              <div className="label-provider">
              <span title="Not connected">MoonPay</span>
              <span className="subtitle-label">(fee 5%)</span>
              </div>
            </label>
          </div>
        </div>
        <Button variant="primary" onClick={onSubmit} disabled={!selectedOption && true}>
          Continue
        </Button>
      </motion.div>
    </Form>
  );
};

export default ProviderSelection;
