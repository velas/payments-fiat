import sha3 from "crypto-js/sha3";
import bs58 from "bs58";


export const isValidAddress = function ({ address, token }) {
  if (!token) throw new Error("[isValidAddress function] error: Token is not defined");
  if (token === "vlx_native") {
    return isValidNativeAddress(address);
  }
  if (["vlx", "vlx_usdv"].indexOf(token) > -1) {
    return isValidEVMAddress(address);
  }
};

export const isValidNativeAddress = function (address, cb) {
  try {
    const decoded = bs58.decode(address);
    if (decoded.length != 32) {
      return false;
    }
  } catch (e$) {
    return false;
  }
  return true;
};

export const isValidEVMAddress = function (address) {
  const isChecksumAddress = function (address) {
    var addressHash, i;
    address = address.replace('0x', '');
    addressHash = sha3(address.toLowerCase());
    i = 0;
    while (i < 40) {
      if (
        (parseInt(addressHash[i], 16) > 7 &&
          address[i].toUpperCase() !== address[i]) ||
        (parseInt(addressHash[i], 16) <= 7 &&
          address[i].toLowerCase() !== address[i])
      ) {
        return false;
      }
      i++;
    }
    return true;
  };
  const isAddress = function (address) {
    if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
      return false;
    } else {
      if (
        /^(0x)?[0-9a-f]{40}$/.test(address) ||
        /^(0x)?[0-9A-F]{40}$/.test(address)
      ) {
        return true;
      } else {
        return isChecksumAddress(address);
      }
    }
  };

  return isAddress(address);
};

