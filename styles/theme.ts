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
    orange: string;
    operation: {
      fixed: string;
      variable: string;
    };

    colors: string[];

    markets: {
      simple: string;
      advanced: string;
    };

    components: {
      bg: string;
    };

    healthFactor: {
      bg: {
        safe: string;
        warning: string;
        danger: string;
      };
      safe: string;
      warning: string;
      danger: string;
    };
  }
  interface PaletteOptions {
    figma: {
      grey: Partial<Palette['grey']>;
    };

    blue: string;
    green: string;
    red: string;
    orange: string;
    operation: {
      fixed: string;
      variable: string;
    };

    colors: string[];

    markets: {
      simple: string;
      advanced: string;
    };

    components: {
      bg: string;
    };

    healthFactor: {
      bg: {
        safe: string;
        warning: string;
        danger: string;
      };
      safe: string;
      warning: string;
      danger: string;
    };
  }

  interface TypographyVariants {
    fontFamilyMonospaced: string;
    modalRow: TypographyVariants['body1'];
    modalCol: TypographyVariants['body1'];
    cardTitle: TypographyVariants['body1'];
    link: TypographyVariants['body1'];
    chip: TypographyVariants['body1'];
    dashboardTitle: TypographyVariants['body1'];
    dashboardMainSubtitle: TypographyVariants['body1'];
    dashboardSubtitleNumber: TypographyVariants['body1'];
    dashboardOverviewAmount: TypographyVariants['h1'];
    dashboardOverviewSubtitle2: TypographyVariants['subtitle2'];
  }
  interface TypographyVariantsOptions {
    fontFamilyMonospaced: string;
    modalRow: TypographyVariants['body1'];
    modalCol: TypographyVariants['body1'];
    cardTitle: TypographyVariants['body1'];
    link: TypographyVariants['body1'];
    chip: TypographyVariants['body1'];
    dashboardTitle: TypographyVariants['body1'];
    dashboardMainSubtitle: TypographyVariants['h6'];
    dashboardSubtitleNumber: TypographyVariants['body1'];
    dashboardOverviewAmount: TypographyVariants['h1'];
    dashboardOverviewSubtitle2: TypographyVariants['subtitle2'];
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    modalRow: true;
    modalCol: true;
    cardTitle: true;
    link: true;
    chip: true;
    dashboardTitle: true;
    dashboardMainSubtitle: true;
    dashboardSubtitleNumber: true;
    dashboardOverviewAmount: true;
    dashboardOverviewSubtitle2: true;
  }
}

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
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
        '50': '#F9FAFB',
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
    orange: '#FF8C1A',
    operation: {
      fixed: '#0095FF',
      variable: '#33CC59',
    },
    colors: ['#5DADE2', '#F7DC6F', '#82E0AA', '#BB8FCE', '#F1948A'],
    markets: {
      simple: '#EDEFF2',
      advanced: '#F9FAFB',
    },
    components: {
      bg: '#FFFFFF',
    },
    healthFactor: {
      bg: {
        safe: '#F0FFF4',
        warning: '#FFF7F0',
        danger: '#FFF5F5',
      },
      safe: '#33CC59',
      warning: '#FF8C1A',
      danger: '#D92626',
    },
  },
  typography: {
    fontFamily: 'Inter',
    fontFamilyMonospaced: 'IBM Plex Mono',
    h1: {
      fontSize: 34,
      fontWeight: 600,
    },
    h2: {
      fontSize: 30,
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
      fontWeight: 500,
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
      fontFamily: 'Inter',
      fontSize: 11,
      fontWeight: 700,
    },
    dashboardTitle: {
      fontSize: 16,
      lineHeight: '16px',
      fontWeight: 700,
    },
    dashboardSubtitleNumber: {
      fontFamily: 'IBM Plex Mono',
      color: '#989FA6',
      fontSize: 14,
      lineHeight: '18.2px',
      fontWeight: 500,
    },
    dashboardMainSubtitle: {
      fontFamily: 'IBM Plex Mono',
      color: '#989FA6',
      fontSize: 12,
      lineHeight: '15.6px',
      fontWeight: 600,
    },
    dashboardOverviewAmount: {
      fontSize: 34,
      lineHeight: '41.15px',
      fontWeight: 600,
    },
    dashboardOverviewSubtitle2: {
      fontFamily: 'IBM Plex Mono',
      fontSize: 12,
      lineHeight: '12px',
      fontWeight: 400,
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
          height: '32px',
        },
        contained: {
          '&:hover': {
            backgroundColor: '#2B2B2B',
          },
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
          padding: '8px',
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
    MuiLink: {
      styleOverrides: {
        root: {
          color: '#000',
        },
        underlineAlways: {
          textDecorationColor: '#000',
        },
      },
    },
  },
  shadows: Array(25).fill('none') as Shadows,
});

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#fafafa',
      '50': '#BCBFC2',
      '100': '#9a9a9a',
      '200': '#62666A',
    },
    grey: {
      '900': '#fafafa',
      '700': '#F9FAFB',
      '600': '#EDF0F2',
      '500': '#E3E5E8',
      '400': '#BCBFC2',
      '300': '#9a9a9a',
      '200': '#62666A',
      '100': '#303336',
      '50': '#0D0E0F',
    },
    figma: {
      grey: {
        '700': '#EDEFF2',
        '600': '#94979E',
        '500': '#989FA6',
        '300': '#757A80',
        '100': '#6F737B',
        '50': '#303336',
      },
    },
    blue: '#0095FF',
    green: '#33CC59',
    red: '#AD1F1F',
    orange: '#FF8C1A',
    operation: {
      fixed: '#0095FF',
      variable: '#33CC59',
    },
    colors: ['#5DADE2', '#F7DC6F', '#82E0AA', '#BB8FCE', '#F1948A'],
    markets: {
      simple: '#222',
      advanced: '#222',
    },
    components: {
      bg: '#303336',
    },
    healthFactor: {
      bg: {
        safe: '#303336',
        warning: '#303336',
        danger: '#303336',
      },
      safe: '#33CC59',
      warning: '#FF8C1A',
      danger: '#D92626',
    },
  },
  typography: {
    fontFamily: 'Inter',
    fontFamilyMonospaced: 'IBM Plex Mono',
    h1: {
      fontSize: 34,
      fontWeight: 600,
    },
    h2: {
      fontSize: 30,
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
      fontSize: 14,
      color: '#E3E5E8',
      fontFamily: 'IBM Plex Mono',
    },
    subtitle2: {
      fontSize: 12,
      fontFamily: 'IBM Plex Mono',
    },
    caption: {
      color: '#E3E5E8',
      fontFamily: 'IBM Plex Mono',
    },
    modalRow: {
      color: '#F9FAFB',
      fontSize: 13,
      fontWeight: 500,
    },
    modalCol: {
      color: '#fafafa',
      fontSize: 19,
      fontWeight: 600,
    },
    cardTitle: {
      fontSize: 12,
      fontWeight: 600,
      color: '#EDEFF2',
    },
    link: {
      color: '#4193f7',
      fontSize: 13,
      fontWeight: 700,
    },
    chip: {
      fontFamily: 'Inter',
      fontSize: 11,
      fontWeight: 700,
    },
    dashboardTitle: {
      fontSize: 16,
      lineHeight: '16px',
      fontWeight: 700,
    },
    dashboardSubtitleNumber: {
      fontFamily: 'IBM Plex Mono',
      color: '#989FA6',
      fontSize: 14,
      lineHeight: '18.2px',
      fontWeight: 500,
    },
    dashboardMainSubtitle: {
      fontFamily: 'IBM Plex Mono',
      color: '#989FA6',
      fontSize: 12,
      lineHeight: '15.6px',
      fontWeight: 600,
    },
    dashboardOverviewAmount: {
      fontSize: 34,
      lineHeight: '41.15px',
      fontWeight: 600,
    },
    dashboardOverviewSubtitle2: {
      fontFamily: 'IBM Plex Mono',
      fontSize: 12,
      lineHeight: '12px',
      fontWeight: 400,
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
          height: '32px',
        },
        outlined: {
          color: '#E3E5E8',
          borderColor: '#9a9a9a',
        },
        text: {
          color: '#959595',
        },
      },
    },
    MuiButtonGroup: {
      styleOverrides: {
        outlined: {
          borderColor: 'red',
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
            color: '#fafafa',
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
          backgroundColor: '#222',
          padding: '16px',
          border: '1px solid #62666A',
          borderRadius: '8px',
          color: '#FFFFFF',
          fontSize: '12px',
          filter: 'drop-shadow(0px 4px 10px rgba(97, 102, 107, 0.1))',
        },
        arrow: {
          fontSize: '15px',
          '&::before': {
            backgroundColor: '#222',
            border: '1px solid #62666A',
            filter: 'drop-shadow(0px 4px 10px rgba(97, 102, 107, 0.1))',
          },
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: '#FFF',
        },
        underlineAlways: {
          textDecorationColor: '#FFF',
        },
      },
    },
  },
  shadows: Array(25).fill('none') as Shadows,
});
