import dayjs from 'dayjs';

function getDaysRemaining(maturity: number) {
  const daysRemaining = dayjs.unix(maturity).diff(dayjs(), 'days');

  const rtf = new Intl.RelativeTimeFormat('en', {
    localeMatcher: 'best fit',
    numeric: 'always',
    style: 'long'
  });

  return rtf.format(daysRemaining, 'day');
}

export default getDaysRemaining;
