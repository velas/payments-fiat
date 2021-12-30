import React, { useState, useMemo, useRef, useEffect } from "react";
import { Form, Button, InputGroup, Spinner } from "react-bootstrap";
import { motion } from "framer-motion";
import axios from "axios";
import {
  SIMPLEX_PAYMENT_URIS,
  BASE_API_URL,
  TICKER_URL,
  REDIRECT_URIS,
} from "../../utils/constants";
import queryString from "query-string";
import { v4 as uuidv4 } from "uuid";
import Swal from "sweetalert2";
import EmptyView from "../EmptyView";
import InputAmount from "../InputAmount";
import { formatBalance, formatValue } from "../../utils/format-value";

const parsed = queryString.parse(global.location.search);
console.log("parsed", parsed);

const partner_name = "velas";

const validate_amount_min = 50;
const validate_amount_max = 20000;

const PaymentDetails = (props) => {
  const payment_id = useMemo(uuidv4, []);
  const checkout_url = `${
    global.location.origin
  }/simplex/checkout/${encodeURIComponent(payment_id)}/${encodeURIComponent(
    parsed.env
  )}`;
  const error_url = `${
    global.location.origin
  }/simplex/error/${encodeURIComponent(payment_id)}/${encodeURIComponent(
    parsed.env
  )}`;
  const [tickerData, setTickerData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    async function fetchData() {
      const result = await fetch(TICKER_URL);
      setTickerData(await result.json());
    }
    fetchData();
  }, []);
  const [amount, setAmount] = React.useState(
    parsed.crypto_amount ? parsed.crypto_amount : ""
  );
  let total_amount = null;
  let min_amount = null;
  if (tickerData) {
    const rate =
      tickerData[
        parsed.crypto_currency === "VLX"
          ? "price_usd"
          : `${parsed.crypto_currency}_price`
      ];
    console.log("rate", rate);
    console.log("amount", amount);
    if (rate) {
      // total_amount = amount * rate + (amount*5/100);
      total_amount = amount * rate;
      min_amount = (40 / rate) * 1.1;
    }
  }
  const formRef = useRef(null);

  const onSubmit = (event) => {
    event.returnValue = false;
    setIsLoading(false);
    onSubmit_();
    return false;
  };
  const onSubmit_ = async () => {
    console.log("payment_id", payment_id);
    setIsLoading(true);
    try {
      const params = {
        crypto_currency: parsed.crypto_currency,
        fiat_currency: "USD" || parsed.fiat_currency,
        crypto_amount: Number(amount),
        address: parsed.address,
      };
      const quoteResult = await axios.post(`${BASE_API_URL}/quote`, params);

      if (quoteResult.data.error) throw new Error(quoteResult.data.error);

      const paramsPayment = {
        quote_id: quoteResult.data.quote_id,
        address: parsed.address,
        payment_id: payment_id,
        crypto_currency: parsed.crypto_currency,
      };

      const paymentResult = await axios.post(
        `${BASE_API_URL}/payment`,
        paramsPayment
      );
      if (paymentResult.data.error) throw new Error(paymentResult.data.error);

      formRef.current.submit();
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: e.response?.data || e.message,
      });
      setIsLoading(false);
    }
  };
  const [selectedOption, setSelectedOption] = useState(
    parsed.fiat_currency ? parsed.fiat_currency : "USD"
  );
  if (!parsed.address || !parsed.crypto_currency) return <EmptyView />;
  return (
    <Form
      className="input-form mt-5"
      method="POST"
      ref={formRef}
      onSubmit={onSubmit}
      action={
        SIMPLEX_PAYMENT_URIS[
          window.location.host === "buy.velas.com" ? "mainnet" : "testnet"
        ]
      }
    >
      <motion.div
        className="col-md-8 offset-md-2"
        initial={{ x: "-5vw" }}
        animate={{ x: 0 }}
      >
        <Form.Group>
          <Form.Label class="left-side-p">Want to get:</Form.Label>
          <InputGroup className="mb-3">
            <InputAmount
              value={amount}
              onChangeText={(value) => setAmount(value)}
              placeholder={"0.00"}
            />
            <InputGroup.Text>
              ~ {Number(total_amount).toFixed(2)} USD
            </InputGroup.Text>
          </InputGroup>
          <div class="row_notice_sub">
            <p class="left-side-p">Min amount to buy:</p>
            <p
              class={
                amount
                  ? total_amount < validate_amount_min
                    ? "red"
                    : null
                  : null
              }
            >
              {" "}
              50 USD
            </p>
          </div>
          <div class="row_notice_sub">
            <p class="left-side-p">Fee:</p>
            <p>
              3.5% - 5%, min 10 {selectedOption.value || parsed.fiat_currency}
            </p>
          </div>
        </Form.Group>
        <Button
          variant="primary"
          onClick={onSubmit}
          disabled={!amount || (total_amount < validate_amount_min && true)}
        >
          {isLoading ? "Loading..." : "Buy"}
        </Button>
        <input type="hidden" name="version" value="1" />
        <input type="hidden" name="partner" value={partner_name} />
        <input type="hidden" name="payment_flow_type" value="wallet" />
        <input type="hidden" name="return_url_success" value={checkout_url} />
        <input type="hidden" name="return_url_fail" value={error_url} />
        <input type="hidden" name="payment_id" value={payment_id} />
      </motion.div>
    </Form>
  );
};

export default PaymentDetails;
