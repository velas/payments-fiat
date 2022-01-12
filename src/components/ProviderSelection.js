import React from "react";
import { Form, Button } from "react-bootstrap";
import { motion } from "framer-motion";
import queryString from "query-string";
import EmptyView from "./EmptyView";
import Swal from "sweetalert2";
import { BsInfoCircle } from "react-icons/bs";

const parsed = queryString.parse(global.location.search);
const stringified = queryString.stringify(parsed);

const title_info = `<h2 class="info-style-title">Buying Crypto with your Credit Card</h2>`;
const body = `<p class="info-style">The minimum transaction is $50 , and the maximum is $20,000.<br> These limits are set by the provider. We do not collect any fees. The provider charges a conversion and network fee. <br>Fees range between 3.5% - 5% depends on transaction value. Notice that the provider applies a minimum fee of 10 USD per transaction needed to ensure processing.</p>`;

const ProviderSelection = (props) => {
  const onSubmit = () => {
    props.history.push(`/simplex/2?${stringified}`);
  };
  if (!parsed.address || !parsed.crypto_currency || !parsed.env)
    return <EmptyView />;

  const onInfo = () => {
    Swal.fire({
      icon: "info",
      title: title_info,
      html: body,
    });
  };
  var address = parsed.address;
  const addressCut = address.substring(0, 8) + "..." + address.substring(35);
  return (
    <Form className="form mt-5" onSubmit={onSubmit}>
      <motion.div
        className="col-md-10 offset-md-1"
        initial={{ x: "-5vw" }}
        animate={{ x: 0 }}
      >
        <div class="container_info">
          <div class="row_notice">
            <p class="left-side-p">Currency to buy:</p>
            <p>{parsed.crypto_currency}</p>
          </div>
          <div class="row_notice">
            <p class="left-side-p">Your address:</p>
            <p title={address}>{addressCut}</p>
          </div>
          <div class="row_notice">
            <p class="left-side-p">Pay with:</p>

            <p>
              Simplex (Visa/MC){" "}
              <BsInfoCircle onClick={onInfo} className="info-icon" />
            </p>
          </div>
        </div>
        <Button variant="primary" onClick={onSubmit}>
          Continue
        </Button>
      </motion.div>
    </Form>
  );
};

export default ProviderSelection;
