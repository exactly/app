import { createTheme, Shadows } from '@mui/material/styles';

export const globals = {
  maxWidth: 1250,
  onlyMobile: { xs: 'block', sm: 'none' },
  onlyDesktop: { xs: 'none', sm: 'block' },
  onlyDesktopFlex: { xs: 'none', sm: 'flex' },
};

const theme = createTheme({
  palette: {
    primary: {
      main: '#0E0E0E',
      '50': '#d3ecff',
      '100': '#d4d4fa',
      '200': '#a6a6f4',
    },
    grey: {
      '50': '#fafafa',
      '100': '#F9FAFB',
      '200': '#EDF0F2',
      '300': '#94979E',
      '500': '#9a9a9a',
      '600': '#62666A',
      '700': '#6F737B',
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
      fontSize: 32,
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
      fontSize: 24,
    },
    h6: {
      fontWeight: 700,
      fontSize: 20,
    },

    subtitle1: {
      fontWeight: 500,
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
          borderRadius: '32px',
          fontSize: '14px',
          fontWeight: 600,
          padding: '6px 16px',
          height: '34px',
        },
        outlined: {
          color: '#62666A',
          borderColor: '#E3E5E8',
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
    MuiTableCell: {
      styleOverrides: {
        root: {
          paddingLeft: 0,
          paddingRight: 0,
        },
      },
    },
  },
  shadows: Array(25).fill('none') as Shadows,
});

export default theme;
