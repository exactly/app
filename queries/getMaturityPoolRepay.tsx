export function getMaturityPoolRepaysQuery(address: string, maturity: string) {
  return `
  {
    repayAtMaturities(where:{caller: "${address}", maturity: "${maturity}"}){
      id
      market
      maturity
      caller
      borrower
      assets
      debtCovered
    }
  }
  `;
}
