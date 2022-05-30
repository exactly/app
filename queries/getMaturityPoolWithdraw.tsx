export function getMaturityPoolWithdrawsQuery(address: string, maturity: string, market: string) {
  return `
  {
    withdrawAtMaturities(where:{caller: "${address}", maturity: "${maturity}", market: "${market}"}){
      id
      market
      maturity
      caller
      receiver
      owner
      assets
      assetsDiscounted
      timestamp
    }
  }
  `;
}
