export function getSmartPoolBorrowsAndRepays(address: string, market: string) {
  return `
  {
    repays(where:{borrower: "${address}", market: "${market}"}){
      market
      borrower
      assets
    }
    borrows(where:{borrower: "${address}", market: "${market}"}){
      market   
      borrower
      assets
    }
  }
  `;
}
