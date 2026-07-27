"use client";

import { useState, type FormEvent } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import SearchIcon from "@mui/icons-material/Search";
import { apiErrorMessage, type Profile } from "@/lib/api";
import { getProfile } from "@/lib/services";

export default function ProfilesPage() {
  const [userId, setUserId] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [lookedUpId, setLookedUpId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setProfile(null);
    try {
      const result = await getProfile(Number(userId));
      setProfile(result);
      setLookedUpId(userId);
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={3} sx={{ maxWidth: 560 }}>
      <Typography variant="h5">Profiles</Typography>

      <Card variant="outlined">
        <CardContent>
          <form onSubmit={handleLookup}>
            <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
              <TextField
                label="User ID"
                type="number"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                slotProps={{ htmlInput: { min: 1 } }}
                fullWidth
              />
              <Button
                type="submit"
                variant="contained"
                startIcon={<SearchIcon />}
                disabled={!userId || loading}
                sx={{ height: 56, flexShrink: 0 }}
              >
                Look up
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>

      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}

      {profile && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="overline" color="text.secondary">
              Profile for user #{lookedUpId}
            </Typography>
            <Typography variant="body1" sx={{ mt: 1 }}>
              {profile.bio || (
                <em style={{ color: "#888" }}>No bio provided.</em>
              )}
            </Typography>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}
