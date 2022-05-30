import React, {
  useState,
  useMemo,
  useRef,
  useEffect
} from "react";
import {
  Form,
  Button,
  InputGroup,
  FormControl,
  DropdownButton,
  Dropdown,
} from "react-bootstrap";
import { motion } from "framer-motion";
import axios from "axios";
import queryString from "query-string";
import { v4 as uuidv4 } from "uuid";
import Swal from "sweetalert2";
import EmptyView from "./EmptyView";
import { BsInfoCircle } from "react-icons/bs";
import { Provider } from "./ProviderSelection.js";
import UtorgPaymentDetails from "./Utorg/PaymentDetails";
import SimplexPaymentDetails from "./Simplex/PaymentDetails";
import TransakPaymentDetails from "./Transak/PaymentDetails";


const PaymentDetails = (props) => {
  const parsed = queryString.parse(global.location.search);
  const ALL_REQUIRED_PARAMS_MISSED = !parsed.address && !parsed.crypto_currency && !parsed.env;

  const [pageIsLoading, setPageIsLoading] = useState(true);
  const [selectProvider, setSelectProvider] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);


  const hasUrlProvider =
    global && global.location && global.location.pathname &&
    (global.location.pathname || "").split("/provider/").length > 1;

  return (
    <>
      {!hasUrlProvider && (
        <motion.div
          className="col-md-10 offset-md-1 common-provider-selection"
          initial={{ x: "-5vw" }}
          animate={{ x: 0 }}
          style={{zIndex: 2, marginTop: 20}}
        >
          <Provider
            selectedProvider={selectedProvider}
            setSelectedProvider={setSelectedProvider}
          />
        </motion.div>
      )}

      { selectedProvider === "utorg" && (
        <UtorgPaymentDetails
          selectedProvider={selectedProvider}
        />
      )}

      { selectedProvider === "simplex" && (
        <SimplexPaymentDetails
          selectedProvider={selectedProvider}
        />
      )}

      { selectedProvider === "transak" && (
        <TransakPaymentDetails
          selectedProvider={selectedProvider}
        />
      )}

    </>
  );
};

export default PaymentDetails;
