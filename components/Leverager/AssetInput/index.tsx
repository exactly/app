import React, { useCallback, useMemo } from 'react';
import { Box, Button, Skeleton } from '@mui/material';

import ModalInput from 'components/OperationsModal/ModalInput';
import USDValue from 'components/OperationsModal/USDValue';
import useDeposit from 'hooks/useDeposit';
import { useOperationContext } from 'contexts/OperationContext';
import useAccountData from 'hooks/useAccountData';
import useBalance from 'hooks/useBalance';
import Image from 'next/image';
import formatSymbol from 'utils/formatSymbol';

type Props = {
  symbol: string;
  operation?: 'deposit' | 'withdraw';
};

function AssetInput({ operation, symbol }: Props) {
  const { marketAccount } = useAccountData(symbol);
  const { decimals = 18 } = marketAccount ?? {};
  const { handleInputChange: handleDeposit, onMax: onMaxDeposit } = useDeposit();
  const { qty, assetContract } = useOperationContext(); // Agregar symbol
  const walletBalance = useBalance(symbol, assetContract);

  const isDeposit = useMemo(() => operation === 'deposit', [operation]);
  const onChange = useCallback(() => (isDeposit ? handleDeposit : handleDeposit), [handleDeposit, isDeposit]);
  const onMax = useCallback(() => (isDeposit ? onMaxDeposit : onMaxDeposit), [isDeposit, onMaxDeposit]);
  const amount = useMemo(() => (isDeposit ? walletBalance : walletBalance), [isDeposit, walletBalance]);

  return (
    <Box display="flex" flexDirection="column">
      <Box display="flex" alignItems="center" justifyContent="left" gap={0.5}>
        <Image
          src={`/img/assets/${symbol}.svg`}
          alt={formatSymbol(symbol)}
          width={20}
          height={20}
          style={{ maxWidth: '100%', height: 'auto' }}
        />
        <ModalInput
          value={qty}
          decimals={decimals}
          onValueChange={onChange}
          symbol={symbol}
          maxWidth="100%"
          align="left"
        />
      </Box>
      <Box display="flex" justifyContent="left" alignItems="center" marginTop={0.25} height={20} gap={1.5} pl={3}>
        <USDValue qty={qty} symbol={symbol} />
        {amount && Boolean(parseFloat(amount)) ? (
          <Button
            onClick={onMax}
            sx={{
              textTransform: 'uppercase',
              borderRadius: 1,
              p: 0.5,
              minWidth: 'fit-content',
              height: 'fit-content',
              color: 'figma.grey.500',
              fontWeight: 600,
              fontSize: 12,
            }}
            data-testid="modal-on-max"
          >
            Max
          </Button>
        ) : (
          <Skeleton width={32} height={28} />
        )}
      </Box>
    </Box>
  );
}

export default React.memo(AssetInput);
