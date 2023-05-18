import Close from '@mui/icons-material/Close';
import { Alert, AlertTitle, IconButton, Slide, SlideProps, Snackbar } from '@mui/material';
import React, { createContext, useState, useCallback, PropsWithChildren, FC, useContext } from 'react';

export type GlobalErrorContextType = {
  setError: (error: string) => void;
};

export const GlobalErrorContext = createContext<GlobalErrorContextType>({
  setError: () => undefined,
});

export const GlobalErrorProvider: FC<PropsWithChildren> = ({ children }) => {
  const [error, setError] = useState<string>('');

  const cleanError = useCallback(() => setError(''), []);

  function SlideTransition(props: SlideProps) {
    return <Slide {...props} direction="down" />;
  }

  return (
    <GlobalErrorContext.Provider value={{ setError }}>
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
