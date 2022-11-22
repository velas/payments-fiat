import React, { useState } from "react";
  import {
    Form,
    Button,
    InputGroup,
    FormControl,
    DropdownButton,
    Dropdown,
  } from "react-bootstrap";
  import queryString from "query-string";
  
  const parsed = queryString.parse(global.location.search);
  const CRYPTO_CURRENCIES_kv = {
    "vlx": "VLX(EVM)",
    "vlx_native":"VLX(NATIVE)",
  }
  const SUPPORTED_CURRENCIES = [
    "EUR",
    "USD",
  ];
  const DEFAULT_CRYPTO_CURRENCY = parsed.crypto_currency && CRYPTO_CURRENCIES_kv[`${(parsed.crypto_currency).toLowerCase()}`] ? (parsed.crypto_currency).toLowerCase() : 'vlx';
  
  const CurrencyRow = ({
    placeholder,
    label,
    selectedRow,
    setSelectedRow,
    currencies,
    cryptoCurrencies,
  }) => {
    const cryptos = cryptoCurrencies ? Object.keys(cryptoCurrencies) : [];
    return (
      <>
        <Form.Label className="left-side-p">{label}</Form.Label>
        <InputGroup>
          <FormControl
            placeholder={placeholder}
            placeholderStyle={{color: 'red'}}
            disabled
          />
          <DropdownButton
            title={selectedRow}
            id="dropdown-fiat"
            disabled
          >
            {
              (currencies || []).map( it => {
                return (
                  <Dropdown.Item
                    key={it}
                    style={{ fontSize: 12 }}
                    href="#"
                    active={selectedRow === it}
                    onSelect={() => setSelectedRow(it)}
                  >
                    {it}
                  </Dropdown.Item>
                )
              })
            }
            {
              (cryptos || []).map( it => {
                const name = CRYPTO_CURRENCIES_kv[`${it}`]
                return (
                  <Dropdown.Item
                    key={name}
                    style={{ fontSize: 12 }}
                    href="#"
                    active={selectedRow === name}
                    onSelect={() => setSelectedRow(it)}
                  >
                    {name}
                  </Dropdown.Item>
                )
              })
            }
          </DropdownButton>
        </InputGroup>
      </>
    );
  };
  const EmptyComponent = () => {
    const [amount, setAmount] = useState({});
    const [amountFrom, setAmountFrom] = useState({});
    const [amountTo, setAmountTo] = useState({});
    let [selectedFiat, setSelectedFiat] = useState("USD");
    const [selectedCryptoCurrency, setSelectedCryptoCurrency] = useState(DEFAULT_CRYPTO_CURRENCY);
  
    return (
      <>
        <Form className="form-step-2 input-form mt-3">
          <div
            className="col-md-10 offset-md-1"
          >
            <Form.Group>
              <div id="input-block">
                <span className="fiat-amount" id="input-amount">
                  <CurrencyRow
                    placeholder="0.00"
                    label={"Pay"}
                    selectedRow={selectedFiat}
                    currencies={SUPPORTED_CURRENCIES}
                    disabled
                  />
                </span>
                <span id="input-amount">
                  <CurrencyRow
                    placeholder="0.00"
                    label={"Receive"}
                    selectedRow={CRYPTO_CURRENCIES_kv[`${selectedCryptoCurrency}`]}
                    cryptoCurrencies={CRYPTO_CURRENCIES_kv}
                    disabled
                  />
                </span>
              </div>
            </Form.Group>
  
            <Button
              className="submit-button2"
              variant="primary"
              disabled
            >
              {"Buy"}
            </Button>
          </div>
        </Form>
      </>
    );
  };
  
  export default EmptyComponent;
  