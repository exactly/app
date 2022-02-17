export function getMaturityPoolDepositsQuery(address: string) {
  return `
  {
    deposits(where: {address: "${address}", isSmartPool: false}) {
      id
      address
      amount
      fee
      maturityDate
    }
  }`
}