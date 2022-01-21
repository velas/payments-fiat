import React, { useState } from "react";
import { BrowserRouter, Redirect, Route, Switch } from "react-router-dom";
import ProviderSelection from "../components/ProviderSelection";
import Header from "../components/Header";
import EmptyView from "../components/EmptyView";
import PaymentDetails from "../components/Simplex/PaymentDetails";
import ThirdStep from "../components/Simplex/Checkout";
import { motion } from "framer-motion";
import queryString from "query-string";

const parsed = queryString.parse(global.location.search);
const valid = !parsed.address && !parsed.crypto_currency && !parsed.env;
const AppRouter = () => {
  return (
    <BrowserRouter>
      <motion.div
        className="col-md-8 offset-md-2"
        initial={{ x: "-100vw" }}
        animate={{ x: 0 }}
        transition={{ stiffness: 150 }}
      >
        <div className="container">
          <Header class="form" style={{display: valid && 'none'}}/>
          <Switch>
            <Route
              render={(props) => valid ? <PaymentDetails {...props} /> : <ProviderSelection {...props} />}
              path="/"
              exact={true}
            />
            <Route
              render={(props) => <PaymentDetails {...props} />}
              path="/simplex/2"
            />
            <Route
              render={(props) => <ThirdStep {...props} />}
              path="/simplex/checkout"
            />
            <Route
              render={(props) => <EmptyView {...props} />}
              path="/simplex/error"
            />
            <Route render={() => <Redirect to="/" />} />
          </Switch>
        </div>
      </motion.div>
    </BrowserRouter>
  );
};

export default AppRouter;
