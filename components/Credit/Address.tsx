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
    const localAddress = localStorage.getItem(`${app.name}_${app.depositConfig.tokenSymbol}_address`);
    if (localAddress && isAddress(localAddress)) onChange(localAddress);
  }, [onChange, app.name, app.depositConfig.tokenSymbol]);

  const handleInputChange = useCallback(({ target: { value: value_ } }: ChangeEvent<HTMLInputElement>) => {
    setAddress(value_);
  }, []);

  const handleChangeClick = useCallback(() => {
    setAddress('');
    onChange(undefined);
  }, [onChange]);

  const handleNext = useCallback(() => {
    if (!address) return;
    onChange(getAddress(address));
    localStorage.setItem(`${app.name}_${app.depositConfig.tokenSymbol}_address`, address);
    onNextStep();
  }, [address, app.depositConfig.tokenSymbol, app.name, onChange, onNextStep]);

  const handlePaste = useCallback(async () => {
    const text = await navigator.clipboard.readText();
    if (isAddress(text)) setAddress(text);
  }, []);

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
                    {t('Open')} {app.name}
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
                {t('Change')}
              </Button>
            ) : (
              <IconButton onClick={handlePaste}>
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
