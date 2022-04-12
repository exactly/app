import dayjs from 'dayjs';

export default function parseTimestamp(timestamp: string) {
  return dayjs.unix(parseInt(timestamp)).format('DD-MMM-YY');
}
