import { useRouter, type NextRouter } from 'next/router';

export default (): NextRouter => {
  const { pathname, query, ...rest } = useRouter();
  return {
    pathname,
    query: Object.fromEntries(Object.entries(query).filter(([key]) => !['symbol'].includes(key))),
    ...rest,
  };
};
