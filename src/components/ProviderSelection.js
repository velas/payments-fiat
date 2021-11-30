import React, {useState, useEffect} from 'react';
import { useForm } from 'react-hook-form';
import { Form, Button } from 'react-bootstrap';
import { motion } from 'framer-motion';
import CheckBox from './CheckBox';
import Select from "react-select";
import axios from "axios";
import queryString from 'query-string';
import EmptyView from './EmptyView';
 
const { address, crypto_currency, env } = queryString.parse(global.location.search);
const feeSimplex = 10;
const feeRamp = 10;

const ProviderSelection = (props) => { 
  const onSubmit = () => {
    props.history.push(`/simplex/2?address=${encodeURIComponent(address)}&crypto_currncy=${encodeURIComponent(crypto_currency)}&env=${encodeURIComponent(env)}`)
  };
  

  const options = [
    { value: 'Simplex', label: `Simplex (fee: ${feeSimplex} USD)` },
    { value: 'Ramp', label: "Ramp", disabled: true }
  ];
  
  const [selectedOption, setSelectedOption] = useState(null);
  // console.log('selectedOption', selectedOption.value)
  const SelectProvider = () => {
    return (
      <div className="App">
        <Select
          defaultValue={selectedOption}
          onChange={setSelectedOption}
          options={options}
          isSearchable
          isOptionDisabled={(option) => option.disabled}
        />
      </div>
    );
  }
  
  
  if (!address || !crypto_currency || !env) return <EmptyView/>;

  return (
    <Form className="input-form" onSubmit={onSubmit}>
      <motion.div
        className="col-md-8 offset-md-2"
        initial={{ x: '-100vw' }}
        animate={{ x: 0 }}
        transition={{ stiffness: 150 }}
      >
        <Form.Group>
        <Form.Label>Select a provider:</Form.Label>
        <SelectProvider/>
        
        </Form.Group>
        {selectedOption && (
          <>
          <p class="title_notice">You are about to receive funds using fiat funds:</p>
          <div class="row_notice">
            <p>Your address:</p>
            <p class="row_address">{address}</p>
          </div>
          <div class="row_notice">
            <p>Cryptocurrency:</p>
            <p>{crypto_currency}</p>
          </div>
          <div class="row_notice">
            <p>Provider:</p>
            <p>{selectedOption.value}</p>
          </div>
        <Button variant="primary" 
        onClick={onSubmit}
        >
          Next
        </Button>
        </>
        )}
      </motion.div>
    </Form>
  );
};

export default ProviderSelection;
