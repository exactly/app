import Close from '@mui/icons-material/Close';
import { Alert, IconButton, Slide, SlideProps, Snackbar, Typography } from '@mui/material';
import React, { createContext, useState, useCallback, PropsWithChildren, FC, useContext, ReactNode } from 'react';
import { Trans } from 'react-i18next';

export type GlobalErrorContextType = {
  setLoadError: () => void;
};

export const GlobalErrorContext = createContext<GlobalErrorContextType>({
  setLoadError: () => undefined,
});

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="down" />;
}

export const GlobalErrorProvider: FC<PropsWithChildren> = ({ children }) => {
  const [error, setError] = useState<ReactNode>(null);

  const cleanError = useCallback(() => setError(null), []);

  const setLoadError = useCallback(() => {
    setError(
      <Typography>
        <Trans i18nKey="Whoops! We're having trouble loading some data right now. Please try again shortly." />
      </Typography>,
    );
  }, []);

  return (
    <GlobalErrorContext.Provider value={{ setLoadError }}>
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
