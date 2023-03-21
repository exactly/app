import React from 'react';
import ErrorPageMessage from 'components/ErrorPageMessage';
import { useTranslation } from 'react-i18next';

export default function Custom404() {
  const { t } = useTranslation();
  return (
    <ErrorPageMessage
      code={404}
      description={t('Page Not Found')}
      message={t('The page you are looking for is not available.')}
    />
  );
}
