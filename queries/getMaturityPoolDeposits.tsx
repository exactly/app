export function getMaturityPoolDepositsQuery(address: string, maturity: string) {
  return `
  {
    depositAtMaturities(where:{caller: "${address}", maturity: "${maturity}"}){
      id
      market
      maturity
      caller
      owner
      assets
      fee
    }
  }
  `;
}
