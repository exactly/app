export function getDepositsQuery(address: string) {
  return `
  {
    desposits(where: {address: "${address}"}) {
      id
      address
      amount
      fee
    }
  }`
}