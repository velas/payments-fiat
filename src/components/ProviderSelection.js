import React from "react";
import { Form, Button } from "react-bootstrap";
import queryString from "query-string";
import EmptyView from "./EmptyView";
import Swal from "sweetalert2";
import { BsInfoCircle } from "react-icons/bs";
import Select from "react-select";
import useGeoLocation from "react-ipgeolocation";
import { countries_low_fee, countries_high_fee } from "../utils/countries";
import { title_info, body, body_transak, body_utorg } from "./InfoMsg";
import IconSimplex from "../images/simplexLogo";
import IconUtorg from "../images/utorgLogo";
import IconTransak from "../images/transakLogo";

const parsed = queryString.parse(global.location.search);

let valid_address_evm = queryString.parse(parsed.address);
const stringified_valid = queryString.stringify(valid_address_evm);
valid_address_evm =
  stringified_valid.substr(0, 2) === "0x" && parsed.address.length === 42;

export const Provider = (props) => {
  const CRYPTO_CURRENCIES_kv = {
    vlx: "VLX(EVM)",
    vlx_native: "VLX(NATIVE)",
  };
  const CHECK_CRYPTO_CURRENCY =
    parsed.crypto_currency &&
    CRYPTO_CURRENCIES_kv[`${parsed.crypto_currency.toLowerCase()}`]
      ? parsed.crypto_currency.toLowerCase()
      : "vlx";

  const { selectedProvider, setSelectedProvider } = props;

  React.useEffect(() => {
    if (!selectedProvider) {
      setSelectedProvider("transak");
    }
  }, [selectedProvider, setSelectedProvider]);

  const onInfo = () => {
    Swal.fire({
      icon: "info",
      // title: title_info,
      html: providerInfo[selectedProvider],
    });
  };
  const providerInfo = {
    simplex: body,
    transak: body_transak,
    utorg: body_utorg,
  };
  const options = [
    {
      value: "utorg",
      label: "Utorg",
      icon: <IconUtorg width="20" height="20" />,
      disabled: true,
    },
    {
      value: "transak",
      label: "Transak",
      icon: <IconTransak width="20" height="20" />,
    },
    {
      value: "simplex",
      label: "Simplex",
      icon: <IconSimplex width="20" height="20" />,
      disabled: true,
    },
  ];

  const onProviderSelect = (e) => {
    setSelectedProvider(e.value);
  };
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      border: "1px solid rgba(29, 29, 29, 0.12)",
      backgroundColor: state.isFocused ? "rgba(125, 147, 168, 0.08)" : "#fff",
      borderRadius: 8,
      height: 50,
      boxShadow: "none",
      "&:hover": {
        backgroundColor: "rgba(125, 147, 168, 0.08)",
        cursor: "pointer",
      },
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected && "rgba(125, 147, 168, 0.08)",
      color: state.isSelected && "#212529",
      "&:hover": {
        backgroundColor: state.isFocused && "#e9ecef",
        color: state.isFocused && "#212529",
      },
    }),
  };

  return (
    <div className={props.style}>
      <Form.Label className="left-side-p">
        Pay With{" "}
        <span
          className="selected-provider"
          style={{ textTransform: "capitalize" }}
        >
          {selectedProvider}
        </span>
        {selectedProvider && (
          <BsInfoCircle onClick={onInfo} className="info-icon" />
        )}
      </Form.Label>
      <div className="mb-3">
        <Select
          // menuIsOpen
          styles={customStyles}
          // defaultValue={selectedProvider}
          // isDisabled={props.default && true}
          value={options.find((option) => option.value === selectedProvider)}
          onChange={onProviderSelect}
          options={options}
          placeholder="Select a provider"
          isOptionDisabled={(option) => option.disabled}
          getOptionLabel={(e) => (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                cursor: e.disabled ? "not-allowed" : "pointer",
              }}
            >
              {e.icon}
              <span
                className="list-select"
                style={{
                  fontSize: 16,
                  marginTop: 2,
                  marginLeft: 8,
                  color: e.disabled ? "rgba(0, 0, 0, 0.5)" : "inherit",
                }}
              >
                {e.label}
              </span>
              {e.disabled && (
                <span style={{ fontSize: 10, color: "#fff", background: '#7c98de', borderRadius: 10, paddingInline: 5, marginLeft: 8, marginTop: 2 }}>
                  soon
                </span>
              )}
            </div>
          )}
        />
      </div>
    </div>
  );
};
