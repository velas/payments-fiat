import React from "react";
import usdIcon from "../images/currencies-icons/USD.png";
import vlxIcon from "../images/currencies-icons/VLX.png";
import audIcon from "../images/currencies-icons/AUD.png";
import brlIcon from "../images/currencies-icons/BRL.png";
import cadIcon from "../images/currencies-icons/CAD.png";
import czkIcon from "../images/currencies-icons/CZK.png";
import dkkIcon from "../images/currencies-icons/DKK.png";
import eurIcon from "../images/currencies-icons/EUR.png";
import gbpIcon from "../images/currencies-icons/GBP.png";
import kztIcon from "../images/currencies-icons/KZT.png";
import nokIcon from "../images/currencies-icons/NOK.png";
import nzdIcon from "../images/currencies-icons/NZD.png";
import plnIcon from "../images/currencies-icons/PLN.png";
import sekIcon from "../images/currencies-icons/SEK.png";
import uahIcon from "../images/currencies-icons/UAH.png";
import defaultIcon from "../images/currencies-icons/default.png";

const getCurrencyIcon = (currencyCode) => {
  const icons = {
    USD: usdIcon,
    EVM: vlxIcon,
    NATIVE: vlxIcon,
    AUD: audIcon,
    BRL: brlIcon,
    CAD: cadIcon,
    CZK: czkIcon,
    DKK: dkkIcon,
    EUR: eurIcon,
    GBP: gbpIcon,
    KZT: kztIcon,
    NOK: nokIcon,
    NZD: nzdIcon,
    PLN: plnIcon,
    SEK: sekIcon,
    UAH: uahIcon,
  };
  return icons[currencyCode] || defaultIcon;
};

const CurrencyIcon = ({ currencyCode, className }) => {
  return (
    <img
      src={getCurrencyIcon(currencyCode)}
      alt={currencyCode}
      className={className}
    />
  );
};

export default CurrencyIcon;
