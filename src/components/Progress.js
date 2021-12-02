import React from 'react';
import { Link, withRouter } from 'react-router-dom';

const Progress = ({ location: { pathname } }) => {
  const isFirstStep = pathname === '/';
  const isSecondStep = pathname === '/simplex/2';
  const isThirdStep = pathname === '/simplex/checkout';

  return (
    <React.Fragment>
        <div className="steps">
          <div className={'step active'}/>
          <div className={`${isSecondStep || !isFirstStep ? 'step active' : 'step'}`}/>
          <div className={`${!isFirstStep && !isSecondStep ? 'step active' : 'step'}`}/>
        </div>
    </React.Fragment>
  );
};

export default withRouter(Progress);
