export function getMaturityPoolWithdrawsQuery(address: string, maturity: string, market: string) {
  return `
  {
    withdrawAtMaturities(where:{receiver: "${address}", maturity: "${maturity}", market: "${market}"}){
      id
      market
      maturity
      receiver
      owner
      assets
      assetsDiscounted
      timestamp
    }
  }
  `;
}
