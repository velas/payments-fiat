import React, { useState } from 'react';
import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom';
import CheckBox from '../components/CheckBox';
import DropDown from '../components/DropDown';
import ProviderSelection from '../components/ProviderSelection';
import Header from '../components/Header';
import Login from '../components/Login';
import PaymentDetails from '../components/Simplex/PaymentDetails';
import ThirdStep from '../components/ThirdStep';
import { motion } from 'framer-motion';



const AppRouter = () => {
  const [user, setUser] = useState({});

  const updateUser = (data) => {
    setUser((prevUser) => ({ ...prevUser, ...data }));
  };

  const resetUser = () => {
    setUser({});
  };

  return (
    <BrowserRouter>
      <motion.div
        className="col-md-8 offset-md-2"
        initial={{ x: '-100vw' }}
        animate={{ x: 0 }}
        transition={{ stiffness: 150 }}
      >
      <div className="container">
        <Header class="form"/>
        <Switch>
          <Route
            render={(props) => (
              <ProviderSelection {...props} user={user} updateUser={updateUser} />
            )}
            path="/"
            exact={true}
          />
          <Route
            render={(props) => (
              <PaymentDetails {...props} user={user} updateUser={updateUser} />
            )}
            path="/simplex/2"
          />
          <Route
            render={(props) => (
              <ThirdStep
                {...props}
                user={user}
                updateUser={updateUser}
                resetUser={resetUser}
              />
            )}
            path="/third"
          />
          {/* <Route component={Login} path="/login" /> */}
          <Route render={() => <Redirect to="/" />} />
        </Switch>
      </div>
        </motion.div>
    </BrowserRouter>
  );
};

export default AppRouter;
