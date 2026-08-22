"use client";

import { useState, type FormEvent } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";
import { apiErrorMessage, isNotFound, type Profile } from "@/lib/api";
import { getProfile, upsertProfile } from "@/lib/services";

export default function ProfilesPage() {
  const [userId, setUserId] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [lookedUpId, setLookedUpId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Bio editor. `missing` means the lookup 404'd — the user has no profile
  // yet, and PUT will create one rather than replace.
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [missing, setMissing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleLookup = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setProfile(null);
    setEditing(false);
    setMissing(false);
    try {
      const result = await getProfile(Number(userId));
      setProfile(result);
      setLookedUpId(userId);
    } catch (e) {
      if (isNotFound(e)) {
        // Not an error worth shouting about — offer to create one instead.
        setMissing(true);
        setLookedUpId(userId);
      } else {
        setError(apiErrorMessage(e));
      }
    } finally {
      setLoading(false);
    }
  };

  const startEdit = () => {
    setBio(profile?.bio ?? "");
    setSaveError(null);
    setEditing(true);
  };

  const handleSave = async () => {
    if (!lookedUpId) return;
    setSaving(true);
    setSaveError(null);
    try {
      const { profile: saved, created } = await upsertProfile(
        Number(lookedUpId),
        bio.trim(),
      );
      setProfile(saved);
      setMissing(false);
      setEditing(false);
      setToast(
        created
          ? `Profile created for user #${lookedUpId}`
          : `Profile updated for user #${lookedUpId}`,
      );
    } catch (e) {
      setSaveError(apiErrorMessage(e));
    } finally {
      setSaving(false);
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

      {missing && !editing && (
        <Alert
          severity="info"
          action={
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => {
                setBio("");
                setSaveError(null);
                setEditing(true);
              }}
            >
              Create
            </Button>
          }
        >
          User #{lookedUpId} has no profile yet.
        </Alert>
      )}

      {profile && !editing && (
        <Card variant="outlined">
          <CardContent>
            <Stack
              direction="row"
              sx={{ alignItems: "flex-start", justifyContent: "space-between" }}
            >
              <Typography variant="overline" color="text.secondary">
                Profile for user #{lookedUpId}
              </Typography>
              <Button size="small" startIcon={<EditIcon />} onClick={startEdit}>
                Edit
              </Button>
            </Stack>
            <Typography variant="body1" sx={{ mt: 1 }}>
              {profile.bio || (
                <em style={{ color: "#888" }}>No bio provided.</em>
              )}
            </Typography>
          </CardContent>
        </Card>
      )}

      {editing && (
        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="overline" color="text.secondary">
                {missing ? "New profile" : "Edit profile"} for user #{lookedUpId}
              </Typography>
              {saveError && <Alert severity="error">{saveError}</Alert>}
              <TextField
                label="Bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                fullWidth
                multiline
                minRows={3}
                autoFocus
              />
              <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                <Button onClick={() => setEditing(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button variant="contained" onClick={handleSave} disabled={saving}>
                  {saving ? "Saving…" : missing ? "Create profile" : "Save"}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        message={toast}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Stack>
  );
}
