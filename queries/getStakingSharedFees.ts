export default function getStakingSharedFees() {
  return `
    {
      stakingSharedFees {
        id
        amount
      }
    }
  `;
}
