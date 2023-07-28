import { Asset, BridgeStatus, Chain, DestinationCallData, Route } from 'types/Bridge';

export const socketRequest = async <Result>(
  path: string,
  params?: Record<string, string>,
  body?: object,
  method: 'GET' | 'POST' = 'GET',
) => {
  if (!process.env.NEXT_PUBLIC_SOCKET_API_KEY) throw new Error('NEXT_PUBLIC_SOCKET_API_KEY is not defined');

  const response = await fetch(`https://api.socket.tech/v2/${path}${params ? '?' : ''}${new URLSearchParams(params)}`, {
    method,
    headers: {
      'API-KEY': process.env.NEXT_PUBLIC_SOCKET_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const { result } = (await response.json()) as { result: Result };
  return result;
};

export const socketChains = async (): Promise<Chain[] | undefined> => socketRequest('supported/chains');

type AssetsRequestParams = {
  fromChainId: number;
  toChainId: number;
};

export const socketAssets = async ({ fromChainId, toChainId }: AssetsRequestParams): Promise<Asset[] | undefined> =>
  socketRequest('token-lists/from-token-list', {
    fromChainId: fromChainId.toString(),
    toChainId: toChainId.toString(),
  });

type QuoteRequestParams = {
  fromChainId: number;
  toChainId: number;
  fromTokenAddress: `0x${string}`;
  fromAmount: bigint;
  userAddress: `0x${string}`;
  recipient: `0x${string}`;
  toTokenAddress: `0x${string}`;
  destinationPayload: `0x${string}`;
  destinationGasLimit: number;
};

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
}: QuoteRequestParams) =>
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
    isContractCall: 'true',
    destinationPayload,
    destinationGasLimit: destinationGasLimit.toString(),
  });

type BuildTxBody = {
  route: Route;
  destinationCallData?: DestinationCallData;
};

type TXResponse = {
  txTarget: `0x${string}`;
  txData: `0x${string}`;
  value: string;
};

export const socketBuildTX = async (body: BuildTxBody) => {
  const tx = await socketRequest<TXResponse>('build-tx', undefined, body, 'POST');

  // eslint-disable-next-line no-console
  console.log({ tx });
  return tx;
};

type BridgeStatusParams = { transactionHash: string; fromChainId: number; toChainId: number };

export const socketBridgeStatus = async ({ transactionHash, fromChainId, toChainId }: BridgeStatusParams) =>
  socketRequest<BridgeStatus>('bridge-status', {
    transactionHash,
    fromChainId: String(fromChainId),
    toChainId: String(toChainId),
  });
