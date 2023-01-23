import { createTheme, Shadows } from '@mui/material/styles';

export const globals = {
  maxWidth: 1250,
  onlyMobile: { xs: 'block', sm: 'none' },
  onlyDesktop: { xs: 'none', sm: 'block' },
  onlyDesktopFlex: { xs: 'none', sm: 'flex' },
};

declare module '@mui/material/styles' {
  interface Palette {
    figma: {
      grey: Partial<Palette['grey']>;
    };

    blue: string;
    green: string;
    red: string;
    operation: {
      fixed: string;
      variable: string;
    };
  }
  interface PaletteOptions {
    figma: {
      grey: Partial<Palette['grey']>;
    };

    blue: string;
    green: string;
    red: string;
    operation: {
      fixed: string;
      variable: string;
    };
  }

  interface TypographyVariants {
    fontFamilyMonospaced: string;
    modalRow: TypographyVariants['body1'];
    modalCol: TypographyVariants['body1'];
    link: TypographyVariants['body1'];
  }
  interface TypographyVariantsOptions {
    fontFamilyMonospaced: string;
    modalRow: TypographyVariants['body1'];
    modalCol: TypographyVariants['body1'];
    link: TypographyVariants['body1'];
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    modalRow: true;
    modalCol: true;
    link: true;
  }
}

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
      '300': '#E3E5E8',
      '400': '#BCBFC2',
      '500': '#9a9a9a',
      '600': '#62666A',
      '700': '#303336',
      '900': '#0D0E0F',
    },

    figma: {
      grey: {
        '300': '#94979E',
        '700': '#6F737B',
      },
    },

    blue: '#0095FF',
    green: '#33CC59',
    red: '#AD1F1F',
    operation: {
      fixed: 'blue',
      variable: '#33CC59',
    },
  },
  typography: {
    fontFamily: 'articulat-cf',
    fontFamilyMonospaced: 'IBM Plex Mono',
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
    modalRow: {
      color: '#303336',
      fontSize: 14,
      fontWeight: 500,
    },
    modalCol: {
      color: '#0D0E0F',
      fontSize: 20,
      fontWeight: 600,
    },
    link: {
      color: '#4193f7',
      fontSize: 14,
      fontWeight: 700,
    },
  },
  shape: {
    borderRadius: 6,
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
