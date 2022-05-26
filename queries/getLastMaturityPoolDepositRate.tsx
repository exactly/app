export function getLastMaturityPoolDepositRate(market: string, maturity: string) {
  return `
    {
      depositAtMaturities(where:{market: "${market}", maturity: "${maturity}"}, orderBy: id, orderDirection: desc){        
        fee
        assets
        id
        timestamp
      }
    }
    `;
}
