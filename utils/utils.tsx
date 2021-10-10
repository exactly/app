export const transformClasses = (style: any, classes: string) => {
  if (!style) return "style object is mandatory";

  const arr = classes?.split(" ") ?? [];
  return arr
    .map((val) => {
      return style[val] ?? "";
    })
    .join(" ");
};

export const getContractsByEnv = () => {
  const env = process?.env?.NET ?? "local";

  const auditor = require(`contracts/${env}/auditor.json`);
  const exafin = require(`contracts/${env}/exafin.json`);

  return {
    auditor,
    exafin
  };
};

export const formatWallet = (walletAddress: String) => {
  return `${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}`;
};
