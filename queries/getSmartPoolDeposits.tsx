export function getSmartPoolDepositsQuery(address: string) {
  return `
  {
    deposits(where:{owner: "${address}"}){
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
