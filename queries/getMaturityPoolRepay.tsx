export function getMaturityPoolRepaysQuery(address: string, maturity: number, market: string) {
  return `
  {
    repayAtMaturities(where:{borrower: "${address}", maturity: ${maturity}, market: "${market}"}) {
      id
      market
      maturity
      assets
      timestamp
    }
  }
  `;
}
