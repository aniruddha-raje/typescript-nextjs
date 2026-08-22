"use client";

import { useEffect } from "react";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import RefreshIcon from "@mui/icons-material/Refresh";

/**
 * Catches render-time errors inside the authenticated pages. Fetch failures are
 * already handled per page as an Alert; this is the backstop for the errors that
 * would otherwise blank the screen.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Stack spacing={2} sx={{ maxWidth: 560 }}>
      <Alert severity="error">
        <AlertTitle>Something went wrong</AlertTitle>
        {error.message || "An unexpected error occurred."}
        {error.digest && (
          <div style={{ marginTop: 8, opacity: 0.7, fontSize: "0.85em" }}>
            Digest: {error.digest}
          </div>
        )}
      </Alert>
      <div>
        <Button variant="contained" startIcon={<RefreshIcon />} onClick={reset}>
          Try again
        </Button>
      </div>
    </Stack>
  );
}
