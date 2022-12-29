export function getMaturityPoolDepositsQuery(address: string, maturity: number, market: string) {
  return `
  {
    depositAtMaturities(where:{owner: "${address}", maturity: ${maturity}, market: "${market}"}){
      id
      market
      maturity
      owner
      assets
      fee
      timestamp
    }
  }
  `;
}
