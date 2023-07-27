export const socketRequest = async <Result>(
  subdomain: string,
  params?: Record<string, string>,
  body?: object,
  method: 'GET' | 'POST' = 'GET',
) => {
  if (!process.env.NEXT_PUBLIC_SOCKET_API_KEY) throw new Error('NEXT_PUBLIC_SOCKET_API_KEY is not defined');

  const response = await fetch(
    `https://api.socket.tech/v2/${subdomain}${params ? '?' : ''}${new URLSearchParams(params)}`,
    {
      method,
      headers: {
        'API-KEY': process.env.NEXT_PUBLIC_SOCKET_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  );
  const { result } = (await response.json()) as { result: Result };
  return result;
};
