export function getLastMaturityPoolBorrowRate(market: string, maturity: string) {
  return `
    {
      borrowAtMaturities(where:{market: "${market}", maturity: "${maturity}"}, orderDirection: desc, first: 1){          
        fee
        assets
      }
    }
    `;
}
