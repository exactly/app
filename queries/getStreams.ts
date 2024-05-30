export function getStreams(assetAddress: string, address: string, sender: string, canceled: boolean, skip: number) {
  return `
  {
    streams(first: 100, skip: ${skip}, orderBy: timestamp, orderDirection: asc, where: { asset: "${assetAddress}", sender: "${sender}", canceled: ${canceled}}) {
      id
      tokenId
      recipient
      startTime
      endTime
      duration
      depositAmount
      withdrawnAmount
      canceled
      cancelable
      intactAmount
    }
  }
  `;
}
