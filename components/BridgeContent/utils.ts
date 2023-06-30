import { ActiveRoutesResponse, BridgeInput } from 'types/Bridge';

export async function fetchActiveRoutes(address: string) {
  const {
    result: { activeRoutes },
  }: ActiveRoutesResponse = await fetch(`https://api.socket.tech/v2/route/active-routes/users?userAddress=${address}`, {
    headers: {
      'API-KEY': process.env.NEXT_PUBLIC_SOCKET_API_KEY || '',
    },
  }).then((res) => res.json());

  return activeRoutes;
}

export function isBridgeInput(input: unknown): input is BridgeInput {
  return (
    typeof input === 'object' &&
    input !== null &&
    'sourceChainId' in input &&
    'sourceToken' in input &&
    'destinationChainId' in input &&
    'destinationToken' in input &&
    'sourceAmount' in input &&
    'destinationAmount' in input
  );
}
