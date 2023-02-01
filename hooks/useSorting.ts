import { useCallback, useState } from 'react';

type Sort<T> = {
  key?: keyof T;
  direction?: 'asc' | 'desc';
};

export default <T>() => {
  const [sort, setSort] = useState<Sort<T>>({});
  const isActive = useCallback((key: keyof T) => Boolean(sort.key === key && sort.direction), [sort]);
  const direction = useCallback(
    (key: keyof T) => (sort.key === key ? sort.direction : undefined),
    [sort.key, sort.direction],
  );

  const setOrderBy = (key?: keyof T) => {
    if (!key) return;
    sort.key === key
      ? setSort({
          key: sort.direction === 'desc' ? undefined : key,
          direction: sort.direction === 'asc' ? 'desc' : undefined,
        })
      : setSort({ key, direction: 'asc' });
  };

  const sortData = (data: T[]) => {
    if (!sort.key || !sort.direction) {
      return data;
    }

    const currentKey = sort.key as keyof T;
    return [...data].sort((a, b) => {
      if (a[currentKey] < b[currentKey]) {
        return sort.direction === 'asc' ? -1 : 1;
      }
      if (a[currentKey] > b[currentKey]) {
        return sort.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  return { setOrderBy, sortData, direction, isActive };
};
