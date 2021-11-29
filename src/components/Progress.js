import React from 'react';
import { Link, withRouter } from 'react-router-dom';

const Progress = ({ location: { pathname } }) => {
  const isFirstStep = pathname === '/';
  const isSecondStep = pathname === '/simplex/2';
  const isThirdStep = pathname === 'simplex/checkout';
  const isLoginPage = pathname === '/login';

  return (
    <React.Fragment>
      {!isLoginPage ? (
        <div className="steps">
          <div className={`${isFirstStep ? 'step active' : 'step'}`}>
            <div>1</div>
            <div>Step 1</div>
          </div>
          <div className={`${isSecondStep ? 'step active' : 'step'}`}>
            <div>2</div>
            <div>
              {isThirdStep ? <Link to="/simplex/2">Step 2</Link> : 'Step 2'}
            </div>
          </div>
          <div className={`${pathname === 'simplex/checkout' ? 'step active' : 'step'}`}>
            <div>3</div>
            <div>Step 3</div>
          </div>
        </div>
      ) : (
        <div></div>
      )}
    </React.Fragment>
  );
};

export default withRouter(Progress);
