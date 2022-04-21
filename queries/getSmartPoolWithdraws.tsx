export function getSmartPoolWithdrawsQuery(address: string) {
  return `
  {
    withdraws(where:{caller: "${address}"}){
      id
      market
      caller
      receiver
      owner
      assets
      shares
    }
  }
  `;
}
