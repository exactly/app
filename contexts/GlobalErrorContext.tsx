import Close from '@mui/icons-material/Close';
import { Alert, IconButton, Link, Slide, SlideProps, Snackbar, Typography } from '@mui/material';
import React, { createContext, useState, useCallback, PropsWithChildren, FC, useContext, ReactNode } from 'react';
import { Trans } from 'react-i18next';

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
  const [error, setError] = useState<ReactNode>(null);

  const cleanError = useCallback(() => setError(null), []);

  const setIndexerError = useCallback(() => {
    setError(
      <Typography>
        <Trans
          i18nKey="Whoops! Our <1>indexer node</1> is currently experiencing issues and some information may not be displayed."
          components={{
            1: (
              <Link
                href="https://status.thegraph.com/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
                sx={{ color: 'blue' }}
              />
            ),
          }}
        />
      </Typography>,
    );
  }, []);

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
