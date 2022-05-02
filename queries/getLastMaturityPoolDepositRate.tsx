export function getLastMaturityPoolDepositRate(market: string, maturity: string) {
  return `
    {
      depositAtMaturities(where:{market: "${market}", maturity: "${maturity}"}, orderDirection: desc, first: 1){        
        fee
        assets
      }
    }
    `;
}
