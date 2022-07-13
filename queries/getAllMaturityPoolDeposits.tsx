export function getAllMaturityPoolDepositsQuery(address: string) {
  return `
  {
    depositAtMaturities(where:{owner: "${address}"}){
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
