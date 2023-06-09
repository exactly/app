import dayjs from 'dayjs';
import i18n from 'i18n';

import 'dayjs/locale/en';
import 'dayjs/locale/es';

export default function parseTimestamp(timestamp: string | number | bigint, format = 'MMM DD, YYYY'): string {
  if (typeof timestamp === 'string') {
    timestamp = parseInt(timestamp);
  }

  return dayjs.unix(Number(timestamp)).locale(i18n.language).format(format);
}
