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
import TransakCheckout from "../components/Transak/Checkout";
import SimplexCheckout from "../components/Simplex/Checkout";
import queryString from "query-string";

const parsed = queryString.parse(global.location.search);
const valid = !parsed.address && !parsed.crypto_currency && !parsed.env;
const AppRouter = () => {
  return (
    <BrowserRouter>
      <div className="center-container">
        <div className="container">
          <Header class="form" style={{display: 'none'}}/>
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
              render={(props) => <TransakCheckout {...props} />}
              path="/provider/transak/checkout"
            />
             <Route
              render={(props) => <SimplexCheckout {...props} />}
              path="/provider/simplex/checkout"
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
        </div>
    </BrowserRouter>
  );
};

export default AppRouter;
