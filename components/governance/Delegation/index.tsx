import React, { useState } from 'react';
import { Box, Collapse, Divider, TextField, Typography } from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import { LoadingButton } from '@mui/lab';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import AddIcon from '@mui/icons-material/Add';
import { isAddress } from 'viem';
import { formatWallet } from 'utils/utils';

const Delegation = () => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<'self-delegate' | 'add-delegate'>('self-delegate');
  const [input, setInput] = useState<string>('');

  return (
    <Box display="flex" flexDirection="column" gap={4}>
      <Divider flexItem />
      <Box display="flex" flexDirection="column" gap={3}>
        <Typography variant="h6">{t('Votes Delegation')}</Typography>
        <Typography fontSize={14}>
          <Trans
            i18nKey="You have a total of <1>{{amount}} voting power</1> available to delegate."
            components={{
              1: <strong></strong>,
            }}
            values={{ amount: '4,785' }}
          />
        </Typography>
      </Box>
      <Box display="flex" flexDirection="column">
        <Box
          display="flex"
          flexDirection="column"
          p={3}
          gap={2}
          border={({ palette }) => `1px solid ${palette.figma.grey[100]}`}
          borderRadius="8px"
          sx={{
            '&:hover': {
              cursor: 'pointer',
              bgcolor: 'grey.900',
              color: 'grey.50',
            },
            bgcolor: selected === 'self-delegate' ? 'grey.900' : '',
            color: selected === 'self-delegate' ? 'grey.50' : '',
          }}
          onClick={() => setSelected('self-delegate')}
        >
          <Box display="flex" gap={1} alignItems="center">
            <HowToVoteIcon sx={{ fontSize: 24 }} />
            <Typography variant="h6">{t('Self Delegate')}</Typography>
          </Box>
          <Typography fontSize={14}>
            {t('Use your voting rights to vote on proposals directly from your connected wallet.')}
          </Typography>
        </Box>
        <Box
          display="flex"
          flexDirection="column"
          p={3}
          gap={2}
          mt={2}
          border={({ palette }) => `1px solid ${palette.figma.grey[100]}`}
          borderRadius="8px"
          sx={{
            '&:hover': {
              cursor: 'pointer',
              bgcolor: 'grey.900',
              color: 'grey.50',
            },
            bgcolor: selected === 'add-delegate' ? 'grey.900' : '',
            color: selected === 'add-delegate' ? 'grey.50' : '',
          }}
          onClick={() => setSelected('add-delegate')}
        >
          <Box display="flex" gap={1} alignItems="center">
            <AddIcon sx={{ fontSize: 24 }} />
            <Typography variant="h6">{t('Add Delegate')}</Typography>
          </Box>
          <Typography fontSize={14}>
            {t(
              'Delegate your voting rights to a trusted third-party Ethereum address. You never send EXA tokens, only your voting rights and can revoke the delegation at any time.',
            )}
          </Typography>
        </Box>
        <Collapse in={selected === 'add-delegate'}>
          <Box display="flex" flexDirection="column" gap={4} mt={4}>
            <Typography fontSize={14}>
              {t(
                'Enter the address of the third-party you wish to delegate your voting rights to below. You can also check the Delegates List and find someone to represent you.',
              )}
            </Typography>
            <TextField
              variant="outlined"
              fullWidth
              size="small"
              placeholder={t('Enter delegate address') || ''}
              sx={{
                '& .MuiOutlinedInput-root': {
                  p: 0.5,
                  fontSize: 14,
                  '&.Mui-focused fieldset': {
                    border: '1px solid',
                  },
                },
              }}
              onChange={(e) => setInput(e.target.value)}
            />
          </Box>
        </Collapse>
      </Box>
      <LoadingButton
        variant="contained"
        fullWidth
        disabled={selected === 'add-delegate' && !(input && isAddress(input))}
      >
        {selected === 'add-delegate' && Boolean(input && isAddress(input))
          ? `${t('Delegate Votes to')} ${formatWallet(input)}`
          : t('Delegate Votes')}
      </LoadingButton>
    </Box>
  );
};

export default Delegation;
