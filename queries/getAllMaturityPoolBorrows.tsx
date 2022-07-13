export function getAllMaturityPoolBorrowsQuery(address: string) {
  return `
  {
    borrowAtMaturities(where:{borrower: "${address}"}){
      id
      market
      maturity
      caller
      receiver
      borrower
      assets
      fee
      timestamp
    }
  }
  `;
}
