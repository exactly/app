import React, { type ChangeEvent, type FormEvent, useCallback, useState } from 'react';
import { IconButton, InputAdornment, TextField } from '@mui/material';
import { ArrowCircleRight, Search } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import useReadOnly from 'hooks/useReadOnly';

export const AccountInput = ({ fullWidth, onSubmit }: { fullWidth?: boolean; onSubmit?: () => void }) => {
  const [value, setValue] = useState('');
  const { setAccount } = useReadOnly();
  const { t } = useTranslation();

  const handleChange = useCallback(({ target }: ChangeEvent<HTMLInputElement>) => {
    setValue(target.value);
  }, []);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      onSubmit?.();
      setAccount(value);
    },
    [onSubmit, setAccount, value],
  );

  return (
    <form onSubmit={handleSubmit} style={{ width: fullWidth ? '100%' : undefined }}>
      <TextField
        fullWidth={fullWidth}
        value={value}
        InputProps={{
          sx: (theme) => ({
            height: 32,
            width: fullWidth ? '100%' : 200,
            fontSize: 14,
            fontWeight: 700,
            '& .MuiOutlinedInput-notchedOutline': {
              borderRadius: 24,
              borderColor: theme.palette.mode === 'light' ? '#0E0E0E80' : '#FAFAFA80',
            },
            paddingRight: 0.75,
          }),
          placeholder: t('Search address'),
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton sx={{ padding: 0 }} type="submit">
                <ArrowCircleRight />
              </IconButton>
            </InputAdornment>
          ),
          onChange: handleChange,
        }}
      />
    </form>
  );
};
