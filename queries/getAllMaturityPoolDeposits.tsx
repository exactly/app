export function getAllMaturityPoolDepositsQuery(address: string) {
  return `
  {
    depositAtMaturities(where:{caller: "${address}"}){
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
