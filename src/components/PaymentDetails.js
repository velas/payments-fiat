import React, {
  useState,
  useEffect
} from "react";
import { Provider } from "./ProviderSelection.js";
import UtorgPaymentDetails from "./Utorg/PaymentDetails";
import SimplexPaymentDetails from "./Simplex/PaymentDetails";
import TransakPaymentDetails from "./Transak/PaymentDetails";
import Checkout from "./Utorg/Checkout";
import TransakCheckout from "./Transak/Checkout"
import SimplexCheckout from "./Simplex/Checkout"
import EmptyComponent from "./EmptyComponent"


const PaymentDetails = (props) => {
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [referrer, setReferrer] = useState(document.referrer);

  // console.log('selectedProvider', selectedProvider)
  useEffect(() => {
    if (hasUrlProvider) {
      const provider_ = (global.location.pathname || "").split("/provider/")[1];
      const provider = provider_.replace(/\/+$/g, '');
      setSelectedProvider(provider);
    }
  }, []);

  const hasUrlProvider =
    global && global.location && global.location.pathname &&
    (global.location.pathname || "").split("/provider/").length > 1;

  var location = window.location.href;
  const hasUtorgUrlCheckout = (props.history.location.state && props.history.location.state.step === "WAIT_FOR_POSTBACK") || global.location.pathname === '/provider/utorg/checkout';
  const hasTransakUrlCheckout = location.indexOf("/provider/transak/checkout") > -1;
  const hasSimplexUrlCheckout = location.indexOf("/provider/simplex/checkout") > -1;

  return (
    <>
      { hasUtorgUrlCheckout || hasTransakUrlCheckout || hasSimplexUrlCheckout ?
        (
          <>
          { hasUtorgUrlCheckout && (
          <Checkout
            selectedProvider={selectedProvider}
            {...props}
          />
          )}
           { hasTransakUrlCheckout && (
          <TransakCheckout
            {...props}
          />
          )}
          { hasSimplexUrlCheckout && (
          <SimplexCheckout
            {...props}
          />
          )}
          </>
        )
      : (
        <>
          { !hasUrlProvider && (
            <div
              className="col-md-10 offset-md-1 common-provider-selection"
              style={{zIndex: 2, marginTop: 20}}
            >
              <Provider
                selectedProvider={selectedProvider}
                setSelectedProvider={setSelectedProvider}
                {...props}
              />
            </div>
          )}
          {/* by default, if no provider is selected. Start*/}
          { !selectedProvider && (
            <EmptyComponent/>
          )}
          {/* by default, if no provider is selected. End*/}
          { selectedProvider === "utorg" && (
            <UtorgPaymentDetails
              selectedProvider={selectedProvider}
              redirectTo={props.history.push}
              referrer={referrer}
              {...props}
            />
          )}

          { selectedProvider === "simplex" && (
            <SimplexPaymentDetails
              selectedProvider={selectedProvider}
              {...props}
            />
          )}

          { selectedProvider === "transak" && (
            <TransakPaymentDetails
              selectedProvider={selectedProvider}
              {...props}
            />
          )}
        </>
        )
     }

    </>
  );
};

export default PaymentDetails;
