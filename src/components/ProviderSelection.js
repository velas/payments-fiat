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
import IconSimplex from "../images/simplexLogo"
import IconUtorg from "../images/utorgLogo"
import IconTransak from "../images/transakLogo";

const parsed = queryString.parse(global.location.search);

let valid_address_evm = queryString.parse(parsed.address);
const stringified_valid = queryString.stringify(valid_address_evm);
valid_address_evm =
  stringified_valid.substr(0, 2) === "0x" && parsed.address.length === 42;

  
  export const Provider = (props) => {
    const CRYPTO_CURRENCIES_kv = {
      "vlx": "VLX(EVM)",
      "vlx_native":"VLX(NATIVE)",
    }
  const CHECK_CRYPTO_CURRENCY = parsed.crypto_currency && CRYPTO_CURRENCIES_kv[`${(parsed.crypto_currency).toLowerCase()}`] ? (parsed.crypto_currency).toLowerCase() : 'vlx';

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
      value: "utorg",
      label: "Utorg (Visa/MC)",
      icon: <IconUtorg width='20' height='20'/>
    },
    {
      value: "transak",
      label: "Transak (Visa/MC)",
      icon: <IconTransak width='20' height='20'/>
    },
    {
      value: "simplex",
      label: "Simplex (Visa/MC)",
      icon: <IconSimplex width='20' height='20'/>
    },
  ];

  const onProviderSelect = (e) => {
    setSelectedProvider(e.value);
  }
  const customStyles = {
    control: (provided) => ({
      ...provided,
      border: !selectedProvider ? '2px solid #2684ff' : "",
      borderRadius: 0,
    }),
  };
  
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
          styles={customStyles}
          defaultValue={selectedProvider}
          isDisabled={props.default && true}
          onChange={onProviderSelect}
          options={options}
          placeholder={props.default && props.default}
          isOptionDisabled={(option) => option.disabled}
          getOptionLabel={e => (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {e.icon}
              <span style={{ marginLeft: 5 }}>{e.label}</span>
            </div>
          )}
        />
        {!selectedProvider &&  
      <div style={{color: '#dc3545', marginTop: 5, fontSize: 13}}>
        Please select a provider
      </div>
        }
      </div>
    </div>
  );
};


