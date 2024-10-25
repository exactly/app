import { createTheme, Shadows } from "@mui/material/styles";

export const globals = {
  maxWidth: 1250,
  onlyMobile: { xs: "block", sm: "none" },
  smOrLess: { xs: "block", md: "none" },
  onlyDesktop: { xs: "none", sm: "block" },
  mdOrMore: { xs: "none", md: "block" },
  onlyDesktopFlex: { xs: "none", sm: "flex" },
};

declare module "@mui/material/styles" {
  interface Palette {
    brand: {
      default: string;
      primary: string;
      tertiary: string;
      soft: string;
    };
    neutral: {
      secondary: string;
      soft: string;
    };
  }
  interface PaletteOptions {
    brand: {
      default: string;
      primary: string;
      tertiary: string;
      soft: string;
    };
    neutral: {
      secondary: string;
      soft: string;
    };
  }
}

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0E0E0E",
      "50": "#d3ecff",
      "100": "#d4d4fa",
      "200": "#a6a6f4",
    },
    grey: {
      "50": "#fafafa",
      "100": "#F9FAFB",
      "200": "#EDF0F2",
      "300": "#E3E5E8",
      "400": "#BCBFC2",
      "500": "#9a9a9a",
      "600": "#62666A",
      "700": "#303336",
      "900": "#0D0E0F",
    },

    brand: {
      default: "#12A594",
      primary: "#FBFDFC",
      tertiary: "#83CDC1",
      soft: "#E0F8F3",
    },
    neutral: {
      secondary: "5F6563",
      soft: "#E6E9E8",
    },
  },
  typography: {
    fontFamily: "BDO Grotesk, Inter, sans-serif",
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
      color: "#9a9a9a",
      fontFamily: "IBM Plex Mono",
    },
    subtitle2: {
      fontSize: 12,
      fontFamily: "IBM Plex Mono",
    },
    caption: {
      color: "#9a9a9a",
      fontFamily: "IBM Plex Mono",
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 6,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: "32px",
          fontSize: "13px",
          fontWeight: 600,
          padding: "6px 16px",
          height: "32px",
        },
      },
    },

    MuiLink: {
      styleOverrides: {
        root: {
          color: "#000",
        },
        underlineAlways: {
          textDecorationColor: "#000",
        },
      },
    },
  },
  shadows: Array(25).fill("none") as Shadows,
});

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#fafafa",
      "50": "#BCBFC2",
      "100": "#9a9a9a",
      "200": "#62666A",
    },
    grey: {
      "900": "#fafafa",
      "700": "#F9FAFB",
      "600": "#EDF0F2",
      "500": "#E3E5E8",
      "400": "#BCBFC2",
      "300": "#9a9a9a",
      "200": "#62666A",
      "100": "#303336",
      "50": "#0D0E0F",
    },
    brand: {
      default: "#12A594",
      primary: "#FBFDFC",
      tertiary: "#83CDC1",
      soft: "#E0F8F3",
    },
    neutral: {
      secondary: "5F6563",
      soft: "#E6E9E8",
    },
  },
  typography: {
    fontFamily: "BDO Grotesk, Inter, sans-serif",
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
      color: "#E3E5E8",
      fontFamily: "IBM Plex Mono",
    },
    subtitle2: {
      fontSize: 12,
      fontFamily: "IBM Plex Mono",
    },
    caption: {
      color: "#E3E5E8",
      fontFamily: "IBM Plex Mono",
    },
  },
  shape: {
    borderRadius: 6,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: "32px",
          fontSize: "13px",
          fontWeight: 600,
          padding: "6px 16px",
          height: "32px",
        },
        outlined: {
          color: "#E3E5E8",
          borderColor: "#9a9a9a",
        },
      },
    },

    MuiLink: {
      styleOverrides: {
        root: {
          color: "#FFF",
        },
        underlineAlways: {
          textDecorationColor: "#FFF",
        },
      },
    },
  },
  shadows: Array(25).fill("none") as Shadows,
});
