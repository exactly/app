import Close from '@mui/icons-material/Close';
import { Alert, AlertTitle, IconButton, Slide, SlideProps, Snackbar } from '@mui/material';
import React, { createContext, useState, useCallback, PropsWithChildren, FC, useContext } from 'react';
import { useTranslation } from 'react-i18next';

export type GlobalErrorContextType = {
  setError: (error: string) => void;
  setIndexerError: () => void;
};

export const GlobalErrorContext = createContext<GlobalErrorContextType>({
  setError: () => undefined,
  setIndexerError: () => undefined,
});

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="down" />;
}

export const GlobalErrorProvider: FC<PropsWithChildren> = ({ children }) => {
  const [error, setError] = useState<string>('');
  const { t } = useTranslation();

  const cleanError = useCallback(() => setError(''), []);

  const setIndexerError = useCallback(() => {
    setError(
      t(
        'Apologies! The Graph is currently experiencing issues. Some information may not be displayed. Thanks for your patience.',
      ) || '',
    );
  }, [t]);

  return (
    <GlobalErrorContext.Provider value={{ setError, setIndexerError }}>
      {error && (
        <Snackbar
          open={true}
          autoHideDuration={10000}
          onClose={cleanError}
          TransitionComponent={SlideTransition}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            severity="error"
            action={
              <IconButton size="small" aria-label="close" color="inherit" onClick={cleanError}>
                <Close fontSize="small" />
              </IconButton>
            }
          >
            <AlertTitle>Error</AlertTitle>
            {error}
          </Alert>
        </Snackbar>
      )}
      {children}
    </GlobalErrorContext.Provider>
  );
};

export const useGlobalError = () => {
  const ctx = useContext(GlobalErrorContext);
  if (!ctx) {
    throw new Error('Using GlobalErrorContext outside of provider');
  }
  return ctx;
};
