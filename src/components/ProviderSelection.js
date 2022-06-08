import React from "react";
import { Form, Button } from "react-bootstrap";
import queryString from "query-string";
import EmptyView from "./EmptyView";
import Swal from "sweetalert2";
import { BsInfoCircle } from "react-icons/bs";
import Select from "react-select";
import useGeoLocation from "react-ipgeolocation";
import { countries_low_fee, countries_high_fee } from "../utils/countries";
import {title_info, body, body_transak, body_utorg } from "./InfoMsg"

const parsed = queryString.parse(global.location.search);

let valid_address_evm = queryString.parse(parsed.address);
const stringified_valid = queryString.stringify(valid_address_evm);
valid_address_evm =
  stringified_valid.substr(0, 2) === "0x" && parsed.address.length === 42;

  
  export const Provider = (props) => {
    const CRYPTO_CURRENCIES_kv = {
      "vlx": "VLX(EVM)",
      "vlx_native":"VLX(NATIVE)",
      "vlx_usdv": "VLX(USDV)"
    }
  const CHECK_CRYPTO_CURRENCY = parsed.crypto_currency && CRYPTO_CURRENCIES_kv[`${(parsed.crypto_currency).toLowerCase()}`] ? (parsed.crypto_currency).toLowerCase() : 'vlx';
  const hasUsdvUrl = CHECK_CRYPTO_CURRENCY === 'vlx_usdv';

  const { selectedProvider, setSelectedProvider } = props;
  const onInfo = () => {
    Swal.fire({
      icon: "info",
      title: title_info,
      html: providerInfo[selectedProvider],
    });
  };
  const providerInfo = {
    simplex: body,
    transak: body_transak,
    utorg: body_utorg
  };
  const options = [
    {
      value: "simplex",
      label: "Simplex (Visa/MC)",
      disabled: hasUsdvUrl
    },
    {
      value: "transak",
      label: "Transak (Visa/MC)",
      disabled: hasUsdvUrl
    },
    {
      value: "utorg",
      label: "Utorg (Visa/MC)"
    },
  ];

  const onProviderSelect = (e) => {
    setSelectedProvider(e.value);
  }
  return (
    <div className={props.style}>
      <Form.Label className="left-side-p">
        Pay with <span className="selected-provider" style={{textTransform: "capitalize"}}>{selectedProvider}</span>
        {selectedProvider && (
          <BsInfoCircle onClick={onInfo} className="info-icon" />
        )}
      </Form.Label>
      <div className="mb-3">
        <Select
          defaultValue={selectedProvider}
          isDisabled={props.default && true}
          onChange={onProviderSelect}
          options={options}
          placeholder={props.default && props.default}
          isOptionDisabled={(option) => option.disabled}
        />
      </div>
    </div>
  );
};


