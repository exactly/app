import React, { useCallback, useMemo, useState } from 'react';
import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

import i18n from 'i18n';

import DropdownMenu from 'components/DropdownMenu';

function SelectLanguage() {
  const { t } = useTranslation();
  const [lng, setLng] = useState(i18n.language.substring(0, 2));

  const names: Record<string, string | null> = {
    en: t('English'),
    es: t('Spanish'),
  } as const;

  const onChange = useCallback((option: string) => {
    i18n.changeLanguage(option);
    setLng(option);
  }, []);

  const languages = useMemo(() => Object.keys(i18n.services.resourceStore.data), []);

  return (
    <DropdownMenu
      label={t('Switch language')}
      options={languages}
      onChange={onChange}
      renderValue={
        <Typography fontWeight="700" color="figma.grey.600" fontSize={13.6}>
          {names[lng]}
        </Typography>
      }
      renderOption={(o: string) => (
        <Typography fontWeight="700" color="figma.grey.600" fontSize={13.6}>
          {names[o]}
        </Typography>
      )}
    />
  );
}

export default React.memo(SelectLanguage);
