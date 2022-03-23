import React, { useState, useMemo, useRef, useEffect } from "react";
import { Form, Button } from "react-bootstrap";
import { motion } from "framer-motion";
import queryString from "query-string";
import EmptyView from "./EmptyView";
import Swal from "sweetalert2";
import { BsInfoCircle } from "react-icons/bs";
import Select from "react-select";
import useGeoLocation from "react-ipgeolocation";

const parsed = queryString.parse(global.location.search);
const stringified = queryString.stringify(parsed);
// console.log('stringified', stringified)

const title_info = `<h2 class="info-style-title">Buying Crypto with your Credit Card</h2>`;
const body = `<p class="info-style">The minimum transaction is $50 USD, and the maximum is $20,000 USD.<br> These limits are set by the provider. We do not collect any fees. The provider charges a conversion and network fee. <br>Fees range between 3.5% - 5% depends on transaction value. Notice that the provider applies a minimum fee of $10 USD per transaction needed to ensure processing.</p>`;
const body_transak = `<p class="info-style">The minimum amount is $30 USD **, limit per transaction is $1,500 USD, daily limit per user is $14,000 USD, monthly limit per user is $28,000 USD, and yearly limit per user is $100,000 USD.
<br>These limits are set by the provider. We do not charge any commissions.
<br>Provider fee is 3.5%.<br><br>** For some cryptocurrencies our minimum buy amount may be greater due the minimum withdrawal limit of our partner exchanges.</p>`;

let valid_address_evm = queryString.parse(parsed.address);
const stringified_valid = queryString.stringify(valid_address_evm);
valid_address_evm = stringified_valid.substr(0, 2) === '0x' && parsed.address.length === 42;

const ProviderSelection = (props) => {
  const [selectProvider, setSelectProvider] = useState("")
  const location = useGeoLocation();
  // console.log('location', location.country);
  //3.5%
  const countries = ["AT", "BE", "CY", "EE", "FI", "FR", "DE", "GR", "IE", "IT", "LV", "LU", "MT", "NL", "PT", "ES", "SK", "LT", "GB", "CZ", "SI", "MC"];
  //5.5% 
  const countries1 = ["AU", "CA", "DK", "NZ", "NO", "PL", "SI", "SE", "CH", "AR", "BR", "CL", "CR", "DO", "IS", "ID", "IL", "JP", "MY", "PY", "PE", "PH", "SG", "ZA", "KR", "TH", "TR", "BM", "BG", "HR", "CZ", "FK", "FJ", "GI", "HU", "JM", "KE", "MD", "RO", "MX", "TZ"];

  function checkArray(arr, val) {
    return arr.some(function(arrVal) {
      return val === arrVal;
    });
  }
  function checkArray1(arr, val) {
    return arr.some(function(arrVal) {
      return val === arrVal;
    });
  }
  const checkCountry = checkArray(countries, location.country);
  const checkCountry1 = checkArray1(countries1, location.country);
  if (selectProvider.value === 'Transak' && !checkCountry && !checkCountry1) {
    Swal.fire({
      icon: "info",
      title: "Oops...",
      html: `<p class="info-style">Sorry, but selected payment processing doesn’t work in your country.<br>Please choose another Payment Provider.</p>`,
    });
    setSelectProvider('');
}
  const valid_btn = !selectProvider.value;
  // console.log('selectProvider.value', selectProvider.value)


  const onSubmit = () => {
    props.history.push(`/provider/2?${stringified}&provider=${selectProvider.value}`);
  };
  if (!parsed.address || !parsed.crypto_currency || !parsed.env)
    return <EmptyView />;
  

  const onInfo = () => {
    Swal.fire({
      icon: "info",
      title: title_info,
      html: selectProvider.value === 'Simplex' ? body : body_transak,
    });
  };
  const options = [
    { value: 'Simplex', label: "Simplex (Visa/MC)" },
    { value: 'Transak', label: "Transak (Visa/MC)" }
    ];
	  const Provider = (props) => {		
      return (		
        <div style={props.style}>
          <Form.Label class="left-side-p">Pay with {selectProvider.value}{selectProvider.value && <BsInfoCircle onClick={onInfo} className="info-icon" />}</Form.Label>
            <div className="mb-3">		
              <Select		
                defaultValue={selectProvider}		
                isDisabled={props.default && true}		
                onChange={setSelectProvider}		
                options={options}
                placeholder={props.default && props.default}
              />	
            </div>	
        </div>	
      );		
	  }
  var address = parsed.address;
  const addressCut = address.substring(0, 8) + "..." + address.substring(35);
  return (
    <Form className="form mt-5" onSubmit={onSubmit}>
      <motion.div
        className="col-md-10 offset-md-1"
        initial={{ x: "-5vw" }}
        animate={{ x: 0 }}
      >
        <div class="container_info">
          <div class="row_notice">
            <p class="left-side-p">Currency to buy:</p>
            <p>{valid_address_evm ? "VLX(EVM)" : "VLX(NATIVE)"}</p>
          </div>
          <div class="row_notice">
            <p class="left-side-p">Your address:</p>
            <p title={address}>{addressCut}</p>
          </div>
        <Provider/>

        </div>
        <Button variant="primary" onClick={onSubmit} disabled={valid_btn}>
          Continue
        </Button>
      </motion.div>
    </Form>
  );
};

export default ProviderSelection;
