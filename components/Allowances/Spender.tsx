import React, { memo } from 'react';
import Link from 'next/link';
import { Stack, Typography } from '@mui/material';
import { type Allowance } from 'hooks/useAllowances';
import { formatWallet } from 'utils/utils';
import useEtherscanLink from 'hooks/useEtherscanLink';
import CopyToClipboardButton from 'components/common/CopyToClipboardButton';

const Spender = ({ spenderName, spenderAddress }: Pick<Allowance, 'spenderName' | 'spenderAddress'>) => {
  const { address } = useEtherscanLink();
  return (
    <>
      <Typography fontSize={19} fontWeight={500}>
        {spenderName}
      </Typography>
      <Typography fontFamily="IBM Plex Mono" fontSize={14} fontWeight={500} color="grey.500">
        <Stack direction="row">
          <Link href={address(spenderAddress)} target="_blank" rel="noopener noreferrer">
            <Typography variant="subtitle1" fontSize={14} color="grey.500">
              {formatWallet(spenderAddress)}
            </Typography>
          </Link>
          <CopyToClipboardButton text={spenderAddress} />
        </Stack>
      </Typography>
    </>
  );
};

export default memo(Spender);
