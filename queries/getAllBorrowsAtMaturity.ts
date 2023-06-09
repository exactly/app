export default function getAllBorrowsAtMaturity(address: string) {
  return `
  {
    borrowAtMaturities(where: { borrower: "${address}" }) {
      id
      market
      maturity
      assets
      fee
      timestamp
    }
  }
  `;
}
