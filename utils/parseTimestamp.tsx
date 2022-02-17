import dayjs from 'dayjs';

export default function parseTimestamp(timestamp: string) {
  //we expect a string because that's how the smart contract returns this information
  return dayjs.unix(parseInt(timestamp)).format('DD-MMM-YY');
}
