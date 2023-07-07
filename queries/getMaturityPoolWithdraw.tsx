export function getMaturityPoolWithdrawsQuery(address: string, maturity: number, market: string) {
  return `
  {
    withdrawAtMaturities(where:{receiver: "${address}", maturity: ${maturity}, market: "${market}"}){
      id
      market
      maturity
      timestamp
      positionAssets
      assets
    }
  }
  `;
}
