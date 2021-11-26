import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Dropdown, Button } from 'react-bootstrap';

const DropDown = (props) => (
    <motion.div
    className="col-md-6 offset-md-3"
    initial={{ x: '-100vw' }}
    animate={{ x: 0 }}
    transition={{ stiffness: 150 }}
  >
  <Dropdown>
  <Dropdown.Toggle id="dropdown-basic" class="style-dropdown">
    Provider
  </Dropdown.Toggle>

  <Dropdown.Menu>
    <Dropdown.Item href="#/action-1" value='One'>{props.text1}</Dropdown.Item>
    <Dropdown.Item href="#/action-2" value='Two'>{props.text2}</Dropdown.Item>
  </Dropdown.Menu>
</Dropdown>
  </motion.div>
);
export default DropDown;
