import React, { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Stack, Typography } from '@mui/material';
import CopyToClipboardButton from 'components/common/CopyToClipboardButton';
import useEtherscanLink from 'hooks/useEtherscanLink';
import { type Allowance } from 'hooks/useAllowances';
import { formatWallet } from 'utils/utils';

const Asset = ({ symbol, token }: Pick<Allowance, 'symbol' | 'token'>) => {
  const { address } = useEtherscanLink();
  return (
    <>
      <Stack direction="row" spacing={0.5}>
        <Image
          src={`/img/${symbol.includes('exa') ? 'exaTokens' : 'assets'}/${symbol}.svg`}
          alt={symbol}
          width={24}
          height={24}
          style={{
            maxWidth: '100%',
            height: 'auto',
          }}
        />
        <Typography display="inline" alignSelf="center" fontSize={19} fontWeight={500} ml={1}>
          {symbol}
        </Typography>
      </Stack>
      <Stack direction="row">
        <Link href={address(token)} target="_blank" rel="noopener noreferrer">
          <Typography variant="subtitle1" fontSize="14px" color="grey.500" fontWeight={500}>
            {formatWallet(token)}
          </Typography>
        </Link>
        <CopyToClipboardButton text={token} />
      </Stack>
    </>
  );
};

export default memo(Asset);
