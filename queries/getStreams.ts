export function getStreams(assetAddress: string, address: string, sender: string, canceled: boolean) {
  return `
  {
    streams(orderBy: timestamp, orderDirection: asc, where: { asset: "${assetAddress}", recipient: "${address}", sender: "${sender}", canceled: ${canceled}}) {
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
