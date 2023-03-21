import React from 'react';
import ErrorPageMessage from 'components/ErrorPageMessage';
import { useTranslation } from 'react-i18next';

export default function Custom500() {
  const { t } = useTranslation();
  return (
    <ErrorPageMessage
      code={500}
      description={t('Internal Server Error')}
      message={t('The page you are looking for is not available.')}
    />
  );
}
