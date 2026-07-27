"use client";

import { createTheme } from "@mui/material/styles";

// A clean, light MUI theme with a calm blue primary.
const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#001f54" },
    secondary: { main: "#455a64" },
    background: { default: "#f4f6f8" },
  },
  shape: { borderRadius: 8 },
  typography: {
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiAppBar: { defaultProps: { elevation: 0 } },
    MuiButton: { defaultProps: { disableElevation: true } },
  },
});

export default theme;
