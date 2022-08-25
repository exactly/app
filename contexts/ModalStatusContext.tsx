import { createContext, FC, useContext, useEffect, useState } from 'react';
import AccountDataContext from './AccountDataContext';

type ContextValues = {
  minimized: boolean;
  setMinimized: (minimized: any) => void;
  open: boolean;
  setOpen: (minimized: any) => void;
  modalContent: any;
  setModalContent: (minimized: any) => void;
};

const defaultValues: ContextValues = {
  minimized: false,
  setMinimized: () => {},
  open: false,
  setOpen: () => {},
  modalContent: undefined,
  setModalContent: () => {}
};

const ModalStatusContext = createContext(defaultValues);

export const ModalStatusProvider: FC = ({ children }) => {
  const { getAccountData } = useContext(AccountDataContext);
  const [minimized, setMinimized] = useState<boolean>(false);
  const [open, setIsOpened] = useState<boolean>(false);
  const [modalContent, setContent] = useState<any>();

  const setOpen = (value: boolean) => {
    if (!minimized) {
      setIsOpened(value);
    } else {
      setMinimized(false);
    }
  };

  const setModalContent = (data: any) => {
    if (!minimized) {
      setContent(data);
    } else {
      setMinimized(false);
    }
  };

  useEffect(() => {
    if (!open && modalContent) {
      setTimeout(() => {
        getAccountData();
      }, 5000);
    }
  }, [open]);

  return (
    <ModalStatusContext.Provider
      value={{ open, minimized, modalContent, setMinimized, setOpen, setModalContent }}
    >
      {children}
    </ModalStatusContext.Provider>
  );
};

export default ModalStatusContext;
