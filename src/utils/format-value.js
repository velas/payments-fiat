const formatBalance = (n) => {
  if (n < 1e3) return n;
  if (n >= 1e3 && n < 1e9) return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (n >= 1e9 && n < 1e12) return '≈' + (n / 1e9).toFixed(1) + 'B';
};
const formatValue = (n) => {
    return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};
const wrapNumber = (n) => {
  return n.replace(",", ".").replace(/[^0-9\.]/g, "");
};
const toFixed = function(num, n) {
  var spl = num.toString().split('.');
  if ( spl.length > 1 ) {
      return spl[0]+'.'+spl[1].substr(0,n);
  }
  return spl[0];
}

export { formatBalance, formatValue, wrapNumber, toFixed };
