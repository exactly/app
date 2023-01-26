export default (word: string): string => {
  const pastParticiple: Record<string, string> = {
    deposit: 'deposited',
    withdraw: 'withdrawn',
    repay: 'repaid',
    borrow: 'borrowed',
  };

  return pastParticiple[word] || `${word}ed`;
};
