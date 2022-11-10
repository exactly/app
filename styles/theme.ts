import { createTheme, Shadows } from '@mui/material/styles';

export const globals = {
  maxWidth: 1250,
};

const theme = createTheme({
  palette: {
    primary: {
      main: '#008cf4',
      '50': '#d3ecff',
      '100': '#d4d4fa',
      '200': '#a6a6f4',
    },
    grey: {
      '50': '#fafafa',
      '100': '#e1e1e1',
      '200': '#cccccc',
      '500': '#9a9a9a',
      '900': '#1f1939',
    },
  },
  typography: {
    fontFamily: 'articulat-cf',
    h1: {
      fontSize: 36,
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
      fontSize: 24,
    },
    h6: {
      fontWeight: 700,
    },

    subtitle1: {
      fontWeight: 600,
      fontSize: 14,
      color: '#9a9a9a',
      fontFamily: 'IBM Plex Mono',
    },
    subtitle2: {
      fontSize: 12,
      fontFamily: 'IBM Plex Mono',
    },
    caption: {
      color: '#9a9a9a',
      fontFamily: 'IBM Plex Mono',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 0,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: 24,
        },
      },
    },
  },
  shadows: Array(25).fill('none') as Shadows,
});

export default theme;
