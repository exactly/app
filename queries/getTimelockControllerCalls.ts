export function getTimelockControllerCalls() {
  return `
  {
    timelockControllerCalls(first: 20, orderBy: scheduledAt, orderDirection: desc) {
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
