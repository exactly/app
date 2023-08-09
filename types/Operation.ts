const operations = [
  'borrow',
  'deposit',
  'withdraw',
  'repay',
  'borrowAtMaturity',
  'depositAtMaturity',
  'withdrawAtMaturity',
  'repayAtMaturity',
] as const;

export type Operation = (typeof operations)[number];

export function isValidOperation(operation: string): operation is Operation {
  return operations.includes(operation as Operation);
}

export function isFixedOperation(operation: Operation): boolean {
  return operation.endsWith('AtMaturity');
}
