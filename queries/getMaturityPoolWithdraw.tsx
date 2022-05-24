export function getMaturityPoolWithdrawsQuery(address: string, maturity: string) {
  return `
  {
    withdrawAtMaturities(where:{caller: "${address}", maturity: "${maturity}"}){
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
