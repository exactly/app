import { useRouter, type NextRouter } from 'next/router';

export default (): NextRouter => {
  const {
    query: { symbol, ...query },
    ...rest
  } = useRouter();
  return { query, ...rest };
};
