import React, {useState, useEffect} from 'react';
import { useForm } from 'react-hook-form';
import { Form, Button } from 'react-bootstrap';
import { motion } from 'framer-motion';
import CheckBox from './CheckBox';
import Select from "react-select";
import axios from "axios";
import queryString from 'query-string';
 
const { address, crypto_currency } = queryString.parse(global.location.search);

const ProviderSelection = (props) => {
  const { user } = props;
  const { register, handleSubmit, errors } = useForm({
    defaultValues: {
      first_name: user.first_name,
      last_name: user.last_name
    }
  });
 
  const onSubmit = () => {
    props.history.push(`/simplex/2?address=${encodeURIComponent(address)}&crypto_currncy=${encodeURIComponent(crypto_currency)}`);
  };


  const options = [
    { value: 'Simplex', label: 'Simplex' },
    { value: 'Ramp', label: 'Ramp' }
  ];
  const [selectedOption, setSelectedOption] = useState(null);
  const SelectProvider = () => {
    return (
      <div className="App">
        <Select
          defaultValue={selectedOption}
          onChange={setSelectedOption}
          options={options}
          isSearchable
        />
      </div>
    );
  }
  
  
  if (!address || !crypto_currency) return null;

  return (
    <Form className="input-form" onSubmit={handleSubmit(onSubmit)}>
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
        <Button variant="primary" type="submit">
          Next
        </Button>
        </>
        )}
      </motion.div>
    </Form>
  );
};

export default ProviderSelection;
