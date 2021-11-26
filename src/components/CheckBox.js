import React, { useState } from "react";
import { motion } from "framer-motion";


const CheckBox = (props) => (
  <motion.div
    // className="col-md-6 offset-md-3"
    initial={{ x: "-100vw" }}
    animate={{ x: 0 }}
    transition={{ stiffness: 150 }}
  >
    <div className="checkbox">
      <input type="checkbox" name="provider" value="valuable" id="provider" checked={props.checked}
        onChange={props.onChange}/>
      <label for="provider"></label> {props.text}
    </div>
  </motion.div>
);
export default CheckBox;
