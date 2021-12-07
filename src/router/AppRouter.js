import React, { useState } from "react";
import { BrowserRouter, Redirect, Route, Switch } from "react-router-dom";
import CheckBox from "../components/CheckBox";
import DropDown from "../components/DropDown";
import ProviderSelection from "../components/ProviderSelection";
import Header from "../components/Header";
import EmptyView from "../components/EmptyView";
import PaymentDetails from "../components/Simplex/PaymentDetails";
import ThirdStep from "../components/Simplex/Checkout";
import { motion } from "framer-motion";
import queryString from "query-string";

const { crypto_currency } = queryString.parse(global.location.search);

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
          <Header class="form" crypto={crypto_currency} />
          <Switch>
            <Route
              render={(props) => <ProviderSelection {...props} />}
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
