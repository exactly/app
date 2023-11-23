import React, { useCallback } from 'react';
import { Box, Button } from '@mui/material';

import ModalInput from 'components/OperationsModal/ModalInput';
import USDValue from 'components/OperationsModal/USDValue';
import useAccountData from 'hooks/useAccountData';
import Image from 'next/image';
import formatSymbol from 'utils/formatSymbol';
import { useLeveragerContext } from 'contexts/LeveragerContext';
import { track } from 'utils/segment';

type Props = {
  symbol?: string;
};

function AssetInput({ symbol }: Props) {
  const { input, handleInputChange, onMax, available, blockModal } = useLeveragerContext();
  const { marketAccount } = useAccountData(symbol || 'USDC');
  const { decimals = 18 } = marketAccount ?? {};
  const handleBlur = useCallback(() => {
    track('Input Unfocused', {
      name: 'asset',
      location: 'Leverager',
      symbol,
      value: input.userInput,
    });
  }, [input.userInput, symbol]);

  return (
    <Box display="flex" flexDirection="column">
      <Box display="flex" alignItems="center" justifyContent="left" gap={0.5}>
        {symbol ? (
          <Image
            src={`/img/assets/${symbol}.svg`}
            alt={formatSymbol(symbol)}
            width={20}
            height={20}
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        ) : (
          <Box width={24} height={20} borderRadius="50%" bgcolor="grey.50" />
        )}

        <ModalInput
          value={input.userInput}
          decimals={decimals}
          onValueChange={handleInputChange}
          symbol={symbol}
          maxWidth="100%"
          align="left"
          disabled={!input.collateralSymbol || !input.borrowSymbol || blockModal}
          onBlur={handleBlur}
        />
      </Box>
      <Box display="flex" justifyContent="left" alignItems="center" marginTop={0.25} height={20} gap={1.5} pl={3}>
        <USDValue qty={input.userInput} symbol={symbol || 'USDC'} />
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
          disabled={!available || !parseFloat(available)}
        >
          Max
        </Button>
      </Box>
    </Box>
  );
}

export default React.memo(AssetInput);
