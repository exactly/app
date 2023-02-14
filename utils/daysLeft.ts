export default (maturity: number) => {
  const diff = maturity - Date.now() / 1000;
  const daysLeft = Math.max(Math.floor(diff / (3600 * 24)), 0);
  return `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}`;
};
