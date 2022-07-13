export function getLastMaturityPoolBorrowRate(market: string, maturity: string) {
  return `
    {
      borrowAtMaturities(where:{market: "${market}", maturity: ${parseInt(
    maturity
  )}}, orderBy: id, orderDirection: desc){          
        fee
        assets
        id
        timestamp
      }
    }
    `;
}
