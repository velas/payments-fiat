import React, { useState, useMemo, useRef, useEffect } from "react";
import { Form, Button } from "react-bootstrap";
import { motion } from "framer-motion";
import queryString from "query-string";
import EmptyView from "./EmptyView";
import Swal from "sweetalert2";
import { BsInfoCircle } from "react-icons/bs";
import Select from "react-select";
import useGeoLocation from "react-ipgeolocation";
import { countries_low_fee, countries_high_fee } from "../utils/countries";
import {title_info, body, body_transak, body_utorg } from "./InfoMsg"

const parsed = queryString.parse(global.location.search);
const stringified = queryString.stringify(parsed);

let valid_address_evm = queryString.parse(parsed.address);
const stringified_valid = queryString.stringify(valid_address_evm);
valid_address_evm =
  stringified_valid.substr(0, 2) === "0x" && parsed.address.length === 42;

const ProviderSelection = (props) => {
  const [selectProvider, setSelectProvider] = useState([]);

  const location = useGeoLocation();

  function checkArray(arr, val) {
    return arr.some(function (arrVal) {
      return val === arrVal;
    });
  }
  function checkArray1(arr, val) {
    return arr.some(function (arrVal) {
      return val === arrVal;
    });
  }
  const checkCountry = checkArray(countries_low_fee, location.country);
  const checkCountry1 = checkArray1(countries_high_fee, location.country);
  if (selectProvider.value === "transak" && location.country && !checkCountry && !checkCountry1) {
    Swal.fire({
      icon: "info",
      title: "Oops...",
      html: `<p class="info-style">Sorry, but selected payment processing doesn’t work in your country.<br>Please choose another Payment Provider.</p>`,
    });
    setSelectProvider("");
  }
  const valid_btn = !selectProvider.value;

  const onSubmit = () => {
    props.history.push(`/provider/${selectProvider.value}/?${stringified}`);
  };
  if (!parsed.address || !parsed.crypto_currency || !parsed.env)
    return <EmptyView />;

  const providerInfo = {
    simplex: body,
    transak: body_transak,
    utorg: body_utorg
  };

  const onInfo = () => {
    Swal.fire({
      icon: "info",
      title: title_info,
      html: providerInfo[selectProvider.value],
    });
  };

  const options = [
    {
      value: "simplex",
      label: "Simplex (Visa/MC)",
    },
    {
      value: "transak",
      label: "Transak (Visa/MC)",
    },
    {
      value: "utorg",
      label: "Utorg (Visa/MC)"
    },
  ];

  const Provider = (props) => {
    return (
      <div style={props.style}>
        <Form.Label class="left-side-p">
          Pay with <span className="selected-provider" style={{textTransform: "capitalize"}}>{selectProvider.value}</span>
          {selectProvider.value && (
            <BsInfoCircle onClick={onInfo} className="info-icon" />
          )}
        </Form.Label>
        <div className="mb-3">
          <Select
            defaultValue={selectProvider}
            isDisabled={props.default && true}
            onChange={setSelectProvider}
            options={options}
            placeholder={props.default && props.default}
            isOptionDisabled={(option) => option.disabled}
          />
        </div>
      </div>
    );
  };
  var address = parsed.address;
  const addressCut = address.substring(0, 8) + "..." + address.substring(35);
  return (
    <Form className="form mt-5 select-provider" onSubmit={onSubmit}>
      <motion.div
        className="col-md-10 offset-md-1"
        initial={{ x: "-5vw" }}
        animate={{ x: 0 }}
      >
        <div class="container_info">
          <div class="row_notice">
            <p class="left-side-p">Currency to buy:</p>
            <p>
              {parsed.crypto_currency === "VLX_USDV"
                ? "VLX(USDV)"
                : valid_address_evm
                ? "VLX(EVM)"
                : "VLX(NATIVE)"}
            </p>
          </div>
          <div class="row_notice">
            <p class="left-side-p">Your address:</p>
            <p title={address}>{addressCut}</p>
          </div>
          <Provider />
        </div>
        <Button variant="primary" onClick={onSubmit} disabled={valid_btn}>
          Continue
        </Button>
      </motion.div>
    </Form>
  );
};

export default ProviderSelection;
