import dayjs from 'dayjs';

export default function getHourUTC2Local(utcDateTime = '1970-01-01T00:00:00Z'): string {
  const utcDate = dayjs(utcDateTime);
  return utcDate.format('HH:mm');
}
