import { createContext } from 'react';

type ContextValues = {
  minimized: boolean;
  setMinimized: (minimized: any) => void;
};

const defaultValues: ContextValues = {
  minimized: false,
  setMinimized: () => {}
};

const ModalStatusContext = createContext(defaultValues);

export const ModalStatusProvider = ModalStatusContext.Provider;

export default ModalStatusContext;
