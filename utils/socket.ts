import type { ActiveRoute, Asset, BridgeStatus, Chain, DestinationCallData, Route } from 'types/Bridge';

export const socketRequest = async <Result>(
  path: string,
  params?: Record<string, string>,
  body?: object,
  method: 'GET' | 'POST' = body ? 'POST' : 'GET',
) => {
  if (!process.env.NEXT_PUBLIC_SOCKET_API_KEY) throw new Error('NEXT_PUBLIC_SOCKET_API_KEY is not defined');

  const response = await fetch(`https://api.socket.tech/v2/${path}${params ? '?' : ''}${new URLSearchParams(params)}`, {
    method,
    headers: {
      'API-KEY': process.env.NEXT_PUBLIC_SOCKET_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body, (_, value) => (typeof value === 'bigint' ? String(value) : value)),
  });

  if (!response.ok) throw new Error(`Socket request failed with status ${response.status}`);

  const { result } = (await response.json()) as { result: Result };
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
  recipient?: `0x${string}`;
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
    sort: 'output',
    singleTxOnly: 'false',
    defaultSwapSlippage: '5',
    uniqueRoutesPerBridge: 'false',
    isContractCall: String(!!destinationPayload),
    ...(recipient ? { recipient } : {}),
    ...(destinationPayload && { destinationPayload }),
    ...(destinationPayload ? destinationGasLimit && { destinationGasLimit: destinationGasLimit.toString() } : {}),
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

export const socketActiveRoutes = async ({ userAddress }: { userAddress: string }) =>
  socketRequest<{
    activeRoutes: ActiveRoute[];
  }>('route/active-routes/users', {
    userAddress,
  });
