import { useRouter } from 'next/router';

export default () => {
  const { pathname, query } = useRouter();
  return { pathname, query: Object.fromEntries(Object.entries(query).filter(([key]) => !['symbol'].includes(key))) };
};
