export function getMaturityPoolRepaysQuery(address: string) {
  return `
  {
    repayAtMaturities(where:{caller: "${address}"}){
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
