import dayjs from 'dayjs';

export default function parseTimestamp(timestamp: string) {
  return dayjs.unix(parseInt(timestamp)).format('MMM DD, YYYY');
}
