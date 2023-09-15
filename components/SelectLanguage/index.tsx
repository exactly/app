import React, { useCallback, useMemo, useState } from 'react';
import { Typography, SxProps } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import PublicIcon from '@mui/icons-material/Public';

import { useTranslation } from 'react-i18next';

import i18n from 'i18n';

import DropdownMenu from 'components/DropdownMenu';

const sx: SxProps = {
  fontSize: 13.6,
  color: 'figma.grey.600',
};

function SelectLanguage() {
  const { t } = useTranslation();
  const [lng, setLng] = useState(i18n.language.substring(0, 2));

  const names: Record<string, string> = {
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
      anchorOrigin={{ vertical: -34, horizontal: 'right' }}
      transformOrigin={{ vertical: 'center', horizontal: 'right' }}
      renderValue={
        <>
          <PublicIcon sx={sx} />
          <Typography fontWeight="700" sx={sx}>
            {names[lng]}
          </Typography>
        </>
      }
      renderOption={(o: string) => (
        <>
          <Typography fontWeight="700" sx={sx}>
            {o.toUpperCase()} - {names[o]}
          </Typography>
          {o === lng && <CheckIcon sx={sx} />}
        </>
      )}
      buttonSx={{ minHeight: 26, maxHeight: 26 }}
    />
  );
}

export default React.memo(SelectLanguage);
