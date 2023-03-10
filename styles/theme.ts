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

    colors: string[];

    markets: {
      simple: string;
      advanced: string;
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

    colors: string[];

    markets: {
      simple: string;
      advanced: string;
    };
  }

  interface TypographyVariants {
    fontFamilyMonospaced: string;
    modalRow: TypographyVariants['body1'];
    modalCol: TypographyVariants['body1'];
    cardTitle: TypographyVariants['body1'];
    link: TypographyVariants['body1'];
    chip: TypographyVariants['body1'];
  }
  interface TypographyVariantsOptions {
    fontFamilyMonospaced: string;
    modalRow: TypographyVariants['body1'];
    modalCol: TypographyVariants['body1'];
    cardTitle: TypographyVariants['body1'];
    link: TypographyVariants['body1'];
    chip: TypographyVariants['body1'];
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    modalRow: true;
    modalCol: true;
    cardTitle: true;
    link: true;
    chip: true;
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
        '100': '#EDEFF2',
        '300': '#94979E',
        '500': '#989FA6',
        '600': '#757A80',
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

    colors: ['#0095FF', '#031D30', '#085891', '#5500FF', '#AA00FF'],

    markets: {
      simple: '#EDEFF2',
      advanced: '#F9FAFB',
    },
  },
  typography: {
    fontFamily: 'Inter',
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
      fontSize: 19,
    },

    subtitle1: {
      fontWeight: 500,
      fontSize: 13,
      color: '#9a9a9a',
      fontFamily: 'IBM Plex Mono',
    },
    subtitle2: {
      fontSize: 11,
      fontFamily: 'IBM Plex Mono',
    },
    caption: {
      color: '#9a9a9a',
      fontFamily: 'IBM Plex Mono',
    },
    modalRow: {
      color: '#303336',
      fontSize: 13,
      fontWeight: 500,
    },
    modalCol: {
      color: '#0D0E0F',
      fontSize: 19,
      fontWeight: 600,
    },
    cardTitle: {
      fontSize: 12,
      fontWeight: 600,
      color: '#757A80',
    },
    link: {
      color: '#4193f7',
      fontSize: 13,
      fontWeight: 700,
    },
    chip: {
      fontFamily: 'IBM Plex Mono',
      fontSize: 9,
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
          fontSize: '13px',
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
    MuiRadio: {
      styleOverrides: {
        root: {
          paddingLeft: 0,
          paddingRight: '8px',
          '& .MuiSvgIcon-root': {
            fontSize: 17,
          },
          '&:hover': {
            backgroundColor: 'transparent',
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#fff',
          padding: '16px',
          border: '1px solid #EDF0F2',
          borderRadius: '8px',
          color: '#0E0E0E',
          fontSize: '12px',
          filter: 'drop-shadow(0px 4px 10px rgba(97, 102, 107, 0.1))',
        },
        arrow: {
          fontSize: '15px',
          '&::before': {
            backgroundColor: '#fff',
            border: '1px solid #EDF0F2',
            filter: 'drop-shadow(0px 4px 10px rgba(97, 102, 107, 0.1))',
          },
        },
      },
    },
  },
  shadows: Array(25).fill('none') as Shadows,
});

export default theme;
