export function getStreamsByCategory(assetAddress: string, lastID: string, category: string) {
  return `
  {
    streams(
      first: 1000
      orderBy: id
      orderDirection: asc
      where: {asset: "${assetAddress}", canceled: false, intactAmount_gt: "0", id_gt:"${lastID}", category: "${category}", startTime_lt: ${Math.floor(
        Date.now() / 1000,
      )}}
    ) {
      id
      tokenId
    }
  }
  `;
}
