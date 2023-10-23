import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import type { FC, PropsWithChildren } from 'react';

import type { Operation } from 'types/Operation';
import type { Position } from 'components/DebtManager/types';

type Identifier = 'operation' | 'rewards' | 'rollover' | 'leverager' | 'proto-staker' | 'faucet' | 'get-exa';

export type Args<T extends Identifier> = T extends 'operation'
  ? { operation: Operation; symbol: string; maturity?: bigint }
  : T extends 'rollover'
  ? { from?: Position }
  : T extends 'rewards' | 'leverager' | 'proto-staker' | 'faucet'
  ? undefined
  : never;

type Value = {
  current?: Identifier;
  args?: Args<Identifier>;
  open: (identifier: Identifier, args?: Args<Identifier>) => void;
  close: () => void;
};

const ModalContext = createContext<Value | null>(null);

export const ModalContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const [current, setCurrent] = useState<Identifier>();
  const [args, setArgs] = useState<Args<Identifier>>();
  const open = useCallback((identifier: Identifier, _args: Args<Identifier>) => {
    setArgs(_args);
    setCurrent(identifier);
  }, []);

  const close = useCallback(() => {
    setArgs(undefined);
    setCurrent(undefined);
  }, []);

  const value: Value = {
    current,
    args,
    open,
    close,
  };

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
};

export const useModal = <T extends Identifier>(
  identifier: T,
): ({ isOpen: true; args: Args<T> } | { isOpen: false; args: undefined }) & {
  open: Args<T> extends undefined ? () => void : (args: Args<T>) => void;
  close: () => void;
} => {
  const ctx = useContext(ModalContext);
  if (ctx === null) {
    throw new Error('Using ModalContext outside of provider');
  }

  const { current, args, open: openModal, close } = ctx;
  const open = useCallback(
    (_args?: Args<T>) => {
      openModal(identifier, _args);
    },
    [identifier, openModal],
  );

  return useMemo(() => {
    const isOpen = current === identifier;
    return isOpen ? { isOpen, args: args as Args<T>, open, close } : { isOpen, args: undefined, open, close };
  }, [current, identifier, args, open, close]);
};
