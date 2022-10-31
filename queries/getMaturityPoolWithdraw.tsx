export function getMaturityPoolWithdrawsQuery(address: string, maturity: string, market: string) {
  return `
  {
    withdrawAtMaturities(where:{receiver: "${address}", maturity: ${parseInt(maturity)}, market: "${market}"}){
      id
      market
      timestamp
      maturity
      receiver
      owner
      positionAssets
      assets: assetsDiscounted
    }
  }
  `;
}
