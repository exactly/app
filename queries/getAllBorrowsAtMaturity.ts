export default function getAllBorrowsAtMaturity(address: string) {
  return `
  {
    borrowAtMaturities(where: { receiver: "${address}" }) {
      id
      market
      maturity
      receiver
      borrower
      assets
      fee
      timestamp
    }
  }
  `;
}
