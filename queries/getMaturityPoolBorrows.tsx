export function getMaturityPoolBorrowsQuery(address: string, maturity: number, market: string) {
  return `
  {
    borrowAtMaturities(where:{borrower: "${address}", maturity: ${maturity}, market: "${market}"}){
      id
      market
      maturity
      assets
      fee
      timestamp
    }
  }
  `;
}
