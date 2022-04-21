export function getMaturityPoolWithdrawsQuery(address: string) {
  return `
  {
    withdrawAtMaturities(where:{caller: "${address}"}){
      id
      market
      maturity
      caller
      receiver
      owner
      assets
      assetsDiscounted
    }
  }
  `;
}
