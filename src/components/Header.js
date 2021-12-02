import React from 'react';
import Progress from './Progress';


const Header = (props) => (
  <>
  <div className='header_style'>
    <h1>Buy {props.crypto || "crypto"} fast and easy</h1>
  </div>
  <div className="width-progress">
    <Progress/>
  </div>
  </>
  
);

export default Header;
