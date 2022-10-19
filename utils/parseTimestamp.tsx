import dayjs from 'dayjs';

export default function parseTimestamp(timestamp: string | number) {
  if (typeof timestamp === 'string') {
    timestamp = parseInt(timestamp);
  }
  return dayjs.unix(timestamp).format('MMM DD, YYYY');
}
