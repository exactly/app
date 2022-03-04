export function getSmartPoolDepositsQuery(address: string) {
  return `
  {
    deposits(where: {address: "${address}", isSmartPool: true}) {
      id
      address
      amount
      fee
      maturityDate
      symbol
    }
  }`
}