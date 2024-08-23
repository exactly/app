import { MarketAccount } from 'hooks/useAccountData';

const getVouchersPrice = (accountData: readonly MarketAccount[], symbol: string): bigint => {
  const isExaToken = symbol.length > 3 && symbol.startsWith('exa');

  if (!isExaToken) {
    const tokenData = accountData.find((token) => token.assetSymbol === symbol);

    return tokenData?.usdPrice || 0n;
  } else {
    const s = symbol.slice(3);
    const tokenData = accountData.find((token) => token.assetSymbol === s);
    if (!tokenData) return 0n;

    const totalAssets = tokenData.totalFloatingDepositAssets;
    const totalSupply = tokenData.totalFloatingDepositShares;
    const decimalWAD = 10n ** BigInt(tokenData.decimals);
    const usdPrice = tokenData.usdPrice;

    const shareValue = (totalAssets * decimalWAD) / totalSupply;
    const price = (shareValue * usdPrice) / decimalWAD;

    return price;
  }
};

export default getVouchersPrice;
