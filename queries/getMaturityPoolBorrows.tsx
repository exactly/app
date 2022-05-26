export function getMaturityPoolBorrowsQuery(address: string, maturity: string) {
  return `
  {
    borrowAtMaturities(where:{caller: "${address}", maturity: "${maturity}"}){
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
