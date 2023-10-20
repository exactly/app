import React, { ChangeEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { type Address, isAddress, getAddress } from 'viem';
import { useTranslation } from 'react-i18next';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import {
  Avatar,
  Box,
  Button,
  IconButton,
  OutlinedInput,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  Typography,
} from '@mui/material';
import { App } from '.';

type Props = {
  value?: Address;
  app: App;
  onNextStep: () => void;
  onChange: (a?: Address) => void;
};

const Address = ({ value, app, onNextStep, onChange }: Props) => {
  const [hasOpenedApp, setHasOpenedApp] = useState(false);
  const [address, setAddress] = useState<string | undefined>();
  const { t } = useTranslation();
  useEffect(() => setAddress(value), [value]);
  useEffect(() => {
    onChange(localStorage.getItem(`${app.name}_${app.depositConfig.tokenSymbol}_address`) as Address);
  }, [onChange, app.name, app.depositConfig.tokenSymbol]);

  const handleChange = useCallback(
    (value_?: string) => {
      setAddress(value_);
      localStorage.setItem(`${app.name}_${app.depositConfig.tokenSymbol}_address`, value_ || '');
    },
    [app.depositConfig.tokenSymbol, app.name],
  );

  const handleInputChange = useCallback(
    ({ target: { value: value_ } }: ChangeEvent<HTMLInputElement>) => {
      handleChange(value_);
    },
    [handleChange],
  );

  const handleChangeClick = useCallback(() => {
    handleChange('');
    onChange(undefined);
  }, [handleChange, onChange]);

  const handleNext = useCallback(() => {
    if (!address) return;
    onChange(getAddress(address));
    onNextStep();
  }, [address, onChange, onNextStep]);

  return (
    <>
      <Box display="flex" flexDirection="column" gap={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <Avatar
            src={app.imgURL}
            alt={app.name}
            sx={({ palette }) => ({
              width: 32,
              height: 32,
              border: 1,
              borderColor: palette.mode === 'light' ? 'grey.300' : 'grey.200',
            })}
          />
          <Typography fontSize={24} fontWeight={700}>
            {app.name} {t('receiving address')}
          </Typography>
        </Box>

        <Typography fontSize={16} fontWeight={500} mb={2}>
          {t(
            'Search for the address in your app where you want to receive the borrowed funds, then copy and paste it below.',
          )}
        </Typography>
        <Typography fontWeight={700} fontSize={16}>
          {t('Where do I find the address?')}
        </Typography>
        {!value && (
          <Stepper
            activeStep={hasOpenedApp ? (address ? app.steps.length + 1 : app.steps.length) : 0}
            orientation="vertical"
            sx={{
              '& .MuiStepConnector-line': {
                display: 'none',
              },
              mb: 3,
            }}
          >
            <Step>
              <StepLabel>
                <Link href={app.link} target="_blank" rel="noopener noreferrer">
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setHasOpenedApp(true);
                    }}
                  >
                    Open {app.name}
                  </Button>
                </Link>
              </StepLabel>
              <StepContent></StepContent>
            </Step>
            {app.steps.map((step) => (
              <Step key={step}>
                <StepLabel>{step}</StepLabel>
              </Step>
            ))}
          </Stepper>
        )}
        <OutlinedInput
          value={address}
          onChange={handleInputChange}
          placeholder={`Paste ${app.depositConfig.tokenSymbol} address`}
          fullWidth
          error={!!address && !isAddress(address)}
          sx={{ mb: 3 }}
          endAdornment={
            value ? (
              <Button onClick={handleChangeClick} sx={{ ml: 'auto' }}>
                Change
              </Button>
            ) : (
              <IconButton
                onClick={() => {
                  navigator.clipboard.readText().then((text) => {
                    if (!isAddress(text)) return;
                    handleChange(text);
                    localStorage.setItem(`${app.name}_${app.depositConfig}_address`, text);
                  });
                }}
              >
                <ContentPasteIcon />
              </IconButton>
            )
          }
        />
      </Box>

      <Button variant="contained" onClick={handleNext} disabled={!address || !isAddress(address)} sx={{ mt: 'auto' }}>
        {t('Next')}
      </Button>
    </>
  );
};

export default Address;
