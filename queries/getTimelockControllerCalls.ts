export function getTimelockControllerCalls(first: number) {
  return `
  {
    timelockControllerCalls(first: ${first}, orderBy: scheduledAt, orderDirection: desc) {
      id
      operations {
        index
        target
        data
      }
      scheduler
      scheduledAt
      executor
      executedAt
      canceller
      cancelledAt
    }
  }
  `;
}
