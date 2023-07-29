import type { Asset, BridgeStatus, Chain, DestinationCallData, Route } from 'types/Bridge';

export const socketRequest = async <Result>(
  path: string,
  params?: Record<string, string>,
  body?: object,
  method: 'GET' | 'POST' = body ? 'POST' : 'GET',
) => {
  if (!process.env.NEXT_PUBLIC_SOCKET_API_KEY) throw new Error('NEXT_PUBLIC_SOCKET_API_KEY is not defined');

  console.log(
    method,
    path,
    params,
    body,
    JSON.stringify(body, (_, value) => (typeof value === 'bigint' ? String(value) : value)),
  );
  const response = await fetch(`https://api.socket.tech/v2/${path}${params ? '?' : ''}${new URLSearchParams(params)}`, {
    method,
    headers: {
      'API-KEY': process.env.NEXT_PUBLIC_SOCKET_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body, (_, value) => (typeof value === 'bigint' ? String(value) : value)),
  });
  const { result } = (await response.json()) as { result: Result };
  console.log(result);
  return result;
};

export const socketChains = async (): Promise<Chain[] | undefined> => socketRequest('supported/chains');

export const socketAssets = async ({
  fromChainId,
  toChainId,
}: {
  fromChainId: number;
  toChainId: number;
}): Promise<Asset[] | undefined> =>
  socketRequest('token-lists/from-token-list', {
    fromChainId: fromChainId.toString(),
    toChainId: toChainId.toString(),
  });

export const socketQuote = async ({
  fromChainId,
  toChainId,
  fromAmount,
  fromTokenAddress,
  toTokenAddress,
  userAddress,
  recipient,
  destinationPayload,
  destinationGasLimit,
}: {
  fromChainId: number;
  toChainId: number;
  fromTokenAddress: `0x${string}`;
  fromAmount: bigint;
  userAddress: `0x${string}`;
  recipient: `0x${string}`;
  toTokenAddress: `0x${string}`;
  destinationPayload?: `0x${string}`;
  destinationGasLimit?: bigint;
}) =>
  socketRequest<{
    routes: Route[];
    destinationCallData: DestinationCallData;
  }>('quote', {
    fromChainId: fromChainId.toString(),
    toChainId: toChainId.toString(),
    fromAmount: fromAmount.toString(),
    fromTokenAddress,
    toTokenAddress,
    userAddress,
    recipient,
    sort: 'output',
    singleTxOnly: 'true',
    defaultSwapSlippage: '1',
    uniqueRoutesPerBridge: 'true',
    isContractCall: String(!!destinationPayload),
    ...(destinationPayload && { destinationPayload }),
    ...(destinationGasLimit && { destinationGasLimit: destinationGasLimit.toString() }),
  });

export const socketBuildTX = async (body: { route: Route; destinationCallData?: DestinationCallData }) =>
  socketRequest<{
    txTarget: `0x${string}`;
    txData: `0x${string}`;
    value: string;
  }>('build-tx', undefined, body);

export const socketBridgeStatus = async ({
  transactionHash,
  fromChainId,
  toChainId,
}: {
  transactionHash: string;
  fromChainId: number;
  toChainId: number;
}) =>
  socketRequest<BridgeStatus>('bridge-status', {
    transactionHash,
    fromChainId: String(fromChainId),
    toChainId: String(toChainId),
  });
