export function getLastMaturityPoolDepositRate(market: string, maturity: string) {
  return `
    {
      depositAtMaturities(where:{market: "${market}", maturity: ${parseInt(
    maturity,
  )}}, orderBy: timestamp, orderDirection: desc){        
        fee
        assets
        id
        timestamp
      }
    }
    `;
}
