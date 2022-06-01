export function getSmartPoolAccruedEarnings(greaterThan: number, lessThan: number, market: string) {
  return `
  {
    smartPoolEarningsAccrueds(where:{timestamp_gte: ${greaterThan}, timestamp_lte: ${lessThan}, market: "${market}"}, orderBy: timestamp, orderDirection: desc){
      id
      timestamp
      previousAssets
      earnings,
      market
   }
  }
  `;
}
