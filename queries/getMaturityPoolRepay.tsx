export function getMaturityPoolRepaysQuery(address: string, maturity: string, market: string) {
  return `
  {
    repayAtMaturities(where:{caller: "${address}", maturity: "${maturity}", market: "${market}"}) {	
      id
      market
      maturity
      caller
      borrower
      assets
      debtCovered
      timestamp
    }
  }
  `;
}
