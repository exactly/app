export function getMaturityPoolBorrowsQuery(address: string, maturity: string, market: string) {
  return `
  {
    borrowAtMaturities(where:{receiver: "${address}", maturity: ${parseInt(
      maturity
    )}, market: "${market}"}){
      id
      market
      maturity
      receiver
      borrower
      assets
      fee
      timestamp
    }
  }
  `;
}
