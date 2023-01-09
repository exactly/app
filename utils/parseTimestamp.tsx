import dayjs from 'dayjs';

export default function parseTimestamp(timestamp: string | number, format = 'MMM DD, YYYY') {
  if (typeof timestamp === 'string') {
    timestamp = parseInt(timestamp);
  }
  return dayjs.unix(timestamp).format(format);
}
