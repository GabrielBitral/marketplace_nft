const ETH_DECIMALS = 18;
const ETH_SCALE = BigInt(10) ** BigInt(ETH_DECIMALS);

const assertEth = (value: string) => {
  if (!/^\d+(?:\.\d+)?$/.test(value)) throw new Error("Valor ETH inválido.");
};

export const ethToUnits = (value: string) => {
  assertEth(value);
  const [whole, fraction = ""] = value.split(".");
  const normalizedFraction = fraction.slice(0, ETH_DECIMALS).padEnd(ETH_DECIMALS, "0");
  return BigInt(whole) * ETH_SCALE + BigInt(normalizedFraction);
};

export const formatEth = (units: bigint, fractionDigits = 3) => {
  const sign = units < BigInt(0) ? "-" : "";
  const normalized = units < BigInt(0) ? -units : units;
  const whole = normalized / ETH_SCALE;
  const remainder = normalized % ETH_SCALE;
  const scale = BigInt(10) ** BigInt(fractionDigits);
  const roundedFraction = (remainder * scale + ETH_SCALE / BigInt(2)) / ETH_SCALE;
  const roundedWhole = whole + roundedFraction / scale;
  const fraction = (roundedFraction % scale).toString().padStart(fractionDigits, "0");
  return `${sign}${roundedWhole}.${fraction}`;
};

export const multiplyEth = (value: string, quantity: number) => {
  if (!Number.isInteger(quantity) || quantity < 0) throw new Error("Quantidade inválida.");
  return ethToUnits(value) * BigInt(quantity);
};

export const compareEth = (first: string, second: string) => {
  const firstUnits = ethToUnits(first);
  const secondUnits = ethToUnits(second);
  return firstUnits === secondUnits ? 0 : firstUnits > secondUnits ? 1 : -1;
};

export const calculateEthQuote = (items: Array<{ unitPrice: string; quantity: number }>, coupon?: string) => {
  const subtotal = items.reduce((total, item) => total + multiplyEth(item.unitPrice, item.quantity), BigInt(0));
  const discount = coupon?.toUpperCase() === "KURIO10" ? subtotal / BigInt(10) : BigInt(0);
  const networkFee = ethToUnits("0.016");
  const total = subtotal - discount + networkFee;
  return {
    subtotal: formatEth(subtotal),
    discount: formatEth(discount),
    networkFee: formatEth(networkFee),
    total: formatEth(total),
  };
};
