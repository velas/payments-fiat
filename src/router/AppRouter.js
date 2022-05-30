import React from "react";
import { BrowserRouter, Redirect, Route, Switch } from "react-router-dom";
import ProviderSelection from "../components/ProviderSelection";
import Header from "../components/Header";
import EmptyView from "../components/EmptyView";
import CommonPaymentDetails from "../components/PaymentDetails";
import PaymentDetailsSimplex from "../components/Simplex/PaymentDetails";
import PaymentDetailsUtorg from "../components/Utorg/PaymentDetails";
import PaymentDetailsTransak from "../components/Transak/PaymentDetails";
import ThirdStep from "../components/Simplex/Checkout";
import UtorgCheckout from "../components/Utorg/Checkout";
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
              render={(props) => <CommonPaymentDetails {...props} />}
              path="/"
              exact={true}
            />
            <Route
              render={(props) => <CommonPaymentDetails {...props} />}
              path="/provider"
            />
            <Route
              render={(props) => <PaymentDetailsSimplex {...props} />}
              path="/provider/simplex"
            />
            <Route
              render={(props) => <PaymentDetailsTransak {...props} />}
              path="/provider/transak"
            />
            <Route
              render={(props) => <PaymentDetailsUtorg {...props} />}
              path="/provider/utorg"
            />
            <Route
              render={(props) => <ThirdStep {...props} />}
              path="/provider/checkout"
            />
            <Route
              render={(props) => <UtorgCheckout {...props} />}
              path="/provider/utorg/checkout"
            />
            <Route
              render={(props) => <EmptyView {...props} />}
              path="/provider/error"
            />

            <Route render={() => <Redirect to="/" />} />
          </Switch>
        </div>
      </motion.div>
    </BrowserRouter>
  );
};

export default AppRouter;
