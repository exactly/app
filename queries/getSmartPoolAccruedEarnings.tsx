export function getSmartPoolAccruedEarnings(greaterThan: number, lessThan: number) {
  return `
  {
    smartPoolEarningsAccrueds(where:{timestamp_gte: ${greaterThan}, timestamp_lte: ${lessThan}}, orderBy: timestamp, orderDirection: desc){
      id
      timestamp
      previousAssets
      earnings
   }
  }
  `;
}
