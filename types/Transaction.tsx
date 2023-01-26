export type Transaction = {
  status: 'loading' | 'processing' | 'success' | 'error';
  hash: string | undefined;
};
