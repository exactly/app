function getOneDollar(oracle: string, decimals: number) {
  const value = (1 / parseFloat(oracle)).toFixed(decimals);

  return value;
}
export default getOneDollar;
