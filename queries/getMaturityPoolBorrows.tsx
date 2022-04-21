export function getMaturityPoolBorrowsQuery(address: string) {
  return `
  {
    borrowAtMaturities(where:{caller: "${address}"}){
      id
      market
      maturity
      caller
      receiver
      borrower
      assets
      fee
    }
  }
  `;
}
