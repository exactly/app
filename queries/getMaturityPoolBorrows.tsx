export function getMaturityPoolBorrowsQuery(address: string) {
  return `
  {
    borrows(where: {address: "${address}", isSmartPool: false}) {
      id
      address
      amount
      fee
      maturityDate
      symbol
    }
  }`
}