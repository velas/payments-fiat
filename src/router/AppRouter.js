import React from "react";
import { BrowserRouter, Redirect, Route, Switch } from "react-router-dom";
import ProviderSelection from "../components/ProviderSelection";
import Header from "../components/Header";
import EmptyView from "../components/EmptyView";
import CommonPaymentDetails from "../components/PaymentDetailsMain";
import PaymentDetailsSimplex from "../components/Simplex/PaymentDetails";
import PaymentDetailsUtorg from "../components/Utorg/PaymentDetails";
import PaymentDetailsTransak from "../components/Transak/PaymentDetails";
import ThirdStep from "../components/Simplex/Checkout";
import UtorgCheckout from "../components/Utorg/Checkout";
import TransakCheckout from "../components/Transak/Checkout";
import SimplexCheckout from "../components/Simplex/Checkout";
import queryString from "query-string";
import visaLogo from "../images/payment-methods/visa.svg";
import mcLogo from "../images/payment-methods/mc.svg";
import sepaLogo from "../images/payment-methods/sepa.svg";
import pixLogo from "../images/payment-methods/pix_banco.svg";
import astroLogo from "../images/payment-methods/astropay.png";
import netellerLogo from "../images/payment-methods/Neteller.svg";
import skrillLogo from "../images/payment-methods/Skrill-Logo.svg";
import applePayLogo from "../images/payment-methods/apple_logo.svg";
import googlePayLogo from "../images/payment-methods/google_pay.svg";

const parsed = queryString.parse(global.location.search);
const valid = !parsed.address && !parsed.crypto_currency && !parsed.env;
const currentYear = new Date().getFullYear();
const AppRouter = () => {
  return (
    <BrowserRouter>
      <Header />
      <div className="app-layout">
        <div className="sidebar">
          <h1 className="sidebar-title">Buy VLX Instantly</h1>
          <h2 className="sidebar-subtitle">
            Buy VLX using over 20 payment methods including credit and debit
            cards, bank transfers, SEPA and more.
          </h2>
          <div class="sidebar-methods show-web">
            Accepted payment methods:
            <div className="payment-methods-list">
              <img src={visaLogo} alt="Visa" />
              <img src={mcLogo} alt="MC" />
              <img src={sepaLogo} alt="SEPA" />
              <img src={pixLogo} alt="PIX" />
              <img src={astroLogo} alt="ASTROPAY" />
              {/* <img src={netellerLogo} alt="Neteller" /> */}
              {/* <img src={skrillLogo} alt="Skrill" /> */}
              <img src={applePayLogo} alt="Apple" />
              <img src={googlePayLogo} alt="Google" />
              <span>20+</span>
            </div>
          </div>
        </div>
        <div className="main-content">
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
      <div class="sidebar-methods show-mob">
            Accepted payment methods:
            <div className="payment-methods-list">
              <img src={visaLogo} alt="Visa" />
              <img src={mcLogo} alt="MC" />
              <img src={sepaLogo} alt="SEPA" />
              <img src={pixLogo} alt="PIX" style={{ height: 20, width: 20 }}/>
              <img src={astroLogo} alt="ASTROPAY" style={{ height: 20, width: 20 }}/>
              {/* <img src={netellerLogo} alt="Neteller" /> */}
              {/* <img src={skrillLogo} alt="Skrill" /> */}
              <img src={applePayLogo} alt="Apple" style={{ height: 30, width: 30 }}/>
              <img src={googlePayLogo} alt="Google" style={{ height: 30, width: 30 }}/>
              <span style={{ fontSize: 12 }}>20+</span>
            </div>
          </div>
      <div className="footer-info">
        © Velas {currentYear}. All Rights Reserved
      </div>
    </BrowserRouter>
  );
};

export default AppRouter;
