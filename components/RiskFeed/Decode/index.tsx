import React, { type PropsWithChildren, createContext, useContext } from 'react';
import { decodeFunctionData, type Abi, type Address, isHex, isAddress, Hex } from 'viem';
import { Box, ButtonBase } from '@mui/material';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';

import { SafeTransaction } from '../api';
import useEtherscanLink from 'hooks/useEtherscanLink';
import { formatWallet } from 'utils/utils';

export type Contracts = Record<Address, { name: string; abi: Abi }>;

export const ABIContext = createContext<Contracts>({});

type Props = {
  to: Address;
  data: SafeTransaction['txData']['dataDecoded'];
};

export default function Decode({ to, data }: Props) {
  const contracts = useContext(ABIContext);
  const { address } = useEtherscanLink();
  const { t } = useTranslation();

  if (data === null) {
    return <Bold>{t('Unable to decode')}</Bold>;
  }

  const contract = contracts[to];
  if (!contract || contract.name !== 'TimelockController') {
    return (
      <FunctionDecode name={contract?.name || to} method={data.method}>
        {data.parameters.map((p) => (
          <Argument key={p.name} name={p.name}>
            {isAddress(p.value) ? (
              <Link href={address(p.value)} target="_blank" rel="noopener noreferrer">
                {formatWallet(p.value)}
              </Link>
            ) : (
              p.value
            )}
          </Argument>
        ))}
      </FunctionDecode>
    );
  }

  const target = data.parameters.find((p) => p.name === 'target');
  const payload = data.parameters.find((p) => p.name === 'payload' || p.name === 'data');

  if (!target || !payload) {
    return null;
  }

  if (!isHex(payload.value) || !isAddress(target.value)) {
    return null;
  }

  const targetContract = contracts[target.value];
  if (!targetContract) {
    return null;
  }

  return (
    <FunctionDecode name="TimelockController" method={data.method}>
      <Argument name="target">
        <Link href={address(target.value)} target="_blank" rel="noopener noreferrer">
          {formatWallet(target.value)}
        </Link>
      </Argument>
      <Argument name="data">
        <FunctionCall contract={targetContract.name} abi={targetContract.abi} data={payload.value} />
      </Argument>
    </FunctionDecode>
  );
}

function FunctionCall({ contract, abi, data }: { contract: string; abi: Abi; data: Hex }) {
  const { address } = useEtherscanLink();
  const { functionName, args } = decodeFunctionData({ abi, data });
  const { t } = useTranslation();

  const download = (name: string, json: string) => {
    const element = document.createElement('a');
    const file = new Blob([json], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = `${name}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const abiFn = abi.find((entry) => entry.type === 'function' && entry.name === functionName);
  if (!abiFn || abiFn.type !== 'function' || !args) {
    return null;
  }

  const inputs = abiFn.inputs || [];
  if (inputs.length !== args.length) {
    return null;
  }

  return (
    <FunctionDecode name={contract} method={functionName}>
      {inputs.map((input, index) => {
        const arg = args[index];
        return (
          <Argument key={input.name} name={input.name || 'unknown'}>
            {input.type.startsWith('tuple') ? (
              <ButtonBase
                disableRipple
                sx={{ fontSize: 14, fontWeight: 500, fontFamily: 'fontFamilyMonospaced' }}
                onClick={() =>
                  download(
                    input.name ?? 'data',
                    JSON.stringify(arg, (_, value) => (typeof value === 'bigint' ? String(value) : value), 2),
                  )
                }
              >
                {t('Download')}
              </ButtonBase>
            ) : input.type === 'address' ? (
              <Link href={address(arg as Address)} target="_blank" rel="noopener noreferrer">
                {formatWallet(arg as Address)}
              </Link>
            ) : (
              String(arg)
            )}
          </Argument>
        );
      })}
    </FunctionDecode>
  );
}

function Bold({ children }: PropsWithChildren) {
  return (
    <Box fontFamily="fontFamilyMonospaced" fontWeight={700} fontSize={14} color="grey.900">
      {children}
    </Box>
  );
}

function Argument({ name, children }: PropsWithChildren<{ name: string }>) {
  return (
    <Box display="flex" gap={1}>
      <Box fontFamily="fontFamilyMonospaced" color="grey.700" minWidth={64} fontSize={14}>
        {name}:
      </Box>
      <Box display="flex" fontFamily="fontFamilyMonospaced" fontSize={14} color="grey.900">
        {children}
      </Box>
    </Box>
  );
}

function FunctionDecode({ name, method, children }: PropsWithChildren<{ name?: string; method: string }>) {
  const args = React.Children.count(children);
  return (
    <Box>
      <Bold>
        {name ? `${name}.` : ''}
        {method}({args === 0 ? ')' : ''}
      </Bold>
      {args > 0 && (
        <>
          <Box ml={2}>{children}</Box>
          <Bold>)</Bold>
        </>
      )}
    </Box>
  );
}
