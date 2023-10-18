import { VestInput } from 'types/Vest';

export function isVestInput(input: unknown): input is VestInput {
  return typeof input === 'object' && input !== null && 'chainId' in input && 'amount' in input && 'reserve' in input;
}
