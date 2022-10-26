export function getMaturityPoolRepaysQuery(address: string, maturity: string, market: string) {
  return `
  {
    repayAtMaturities(where:{borrower: "${address}", maturity: ${parseInt(maturity)}, market: "${market}"}) {	
      id
      market
      maturity
      borrower
      assets
      debtCovered
      timestamp
    }
  }
  `;
}
