import i18n from 'i18n';

export default (maturity: number | bigint) => {
  const diff = Number(maturity) - Date.now() / 1000;
  const daysLeft = Math.max(Math.floor(diff / (3600 * 24)), 0);
  return `${daysLeft} ${daysLeft === 1 ? i18n.t('day') : i18n.t('days')}`;
};
