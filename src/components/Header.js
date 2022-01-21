import React from 'react';
import Progress from './Progress';


const Header = (props) => (
  <>
  <div className='header_style'>
    <h1>Buy VLX fast and easy</h1>
  </div>
  <div className="width-progress" style={props.style}>
    <Progress/>
  </div>
  </>
  
);

export default Header;
