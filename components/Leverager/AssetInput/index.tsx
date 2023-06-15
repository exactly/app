import React from 'react';
import { Box, Button, Skeleton } from '@mui/material';

import ModalInput from 'components/OperationsModal/ModalInput';
import USDValue from 'components/OperationsModal/USDValue';
import useAccountData from 'hooks/useAccountData';
import Image from 'next/image';
import formatSymbol from 'utils/formatSymbol';
import { useLeveragerContext } from 'contexts/LeveragerContext';

type Props = {
  symbol: string;
};

function AssetInput({ symbol }: Props) {
  const { input, handleInputChange, onMax, available } = useLeveragerContext();
  const { marketAccount } = useAccountData(symbol);
  const { decimals = 18 } = marketAccount ?? {};

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
          value={input.userInput}
          decimals={decimals}
          onValueChange={handleInputChange}
          symbol={symbol}
          maxWidth="100%"
          align="left"
          disabled={!input.collateralSymbol || !input.borrowSymbol}
        />
      </Box>
      <Box display="flex" justifyContent="left" alignItems="center" marginTop={0.25} height={20} gap={1.5} pl={3}>
        <USDValue qty={input.userInput} symbol={symbol} />
        {available !== undefined ? (
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
            disabled={!parseFloat(available)}
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
