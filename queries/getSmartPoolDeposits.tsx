export function getSmartPoolDepositsQuery(address: string) {
  return `
  {
    deposits(where:{caller: "${address}"}){
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
