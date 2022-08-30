export function getSmartPoolDepositsAndWithdraws(address: string, market: string) {
  return `
  {
    withdraws(where:{owner: "${address}", market: "${market}"}){
      id
      market
      caller
      receiver
      owner
      assets
      shares
      timestamp
    }
    deposits(where:{owner: "${address}", market: "${market}"}){
      id
      market   
      caller
      owner
      assets
      shares
      timestamp
    }
  }
  `;
}
