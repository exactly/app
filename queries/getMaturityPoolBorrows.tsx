export function getMaturityPoolBorrowsQuery(address: string, maturity: string, market: string) {
  return `
  {
    borrowAtMaturities(where:{caller: "${address}", maturity: "${maturity}", market: "${market}"}){
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
