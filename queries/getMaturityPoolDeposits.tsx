export function getMaturityPoolDepositsQuery(address: string, maturity: string, market: string) {
  return `
  {
    depositAtMaturities(where:{caller: "${address}", maturity: "${maturity}", market: "${market}"}){
      id
      market
      maturity
      caller
      owner
      assets
      fee
      timestamp
    }
  }
  `;
}
