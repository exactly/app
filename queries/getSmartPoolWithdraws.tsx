export function getSmartPoolWithdrawsQuery(address: string) {
  return `
  {
    withdraws(where:{owner: "${address}"}){
      id
      market
      caller
      receiver
      owner
      assets
      shares
      timestamp
    }
  }
  `;
}
