"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import { API_BASE_URL } from "@/lib/api";
import { useAsyncData } from "@/lib/useAsyncData";
import {
  getHealthcheck,
  getVersion,
  listPosts,
  listUsers,
} from "@/lib/services";

interface Stats {
  health: string;
  version: string;
  userCount: number | null;
  postCount: number | null;
}

// Module scope keeps the reference stable across renders, as useAsyncData requires.
async function fetchStats(): Promise<Stats> {
  const [health, version] = await Promise.all([getHealthcheck(), getVersion()]);
  // User/post counts are best-effort — don't fail the whole page on them.
  let userCount: number | null = null;
  let postCount: number | null = null;
  try {
    userCount = (await listUsers()).length;
    postCount = (await listPosts()).length;
  } catch {
    /* ignore — counts stay null */
  }
  return { health: health.status, version: version.version, userCount, postCount };
}

export default function DashboardPage() {
  const { data: stats, loading, error } = useAsyncData(fetchStats);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  const cards = [
    {
      label: "API Health",
      value: stats?.health === "ok" ? "Healthy" : (stats?.health ?? "unknown"),
      icon:
        stats?.health === "ok" ? (
          <CheckCircleIcon color="success" />
        ) : (
          <ErrorIcon color="error" />
        ),
    },
    { label: "API Version", value: stats?.version ?? "—" },
    { label: "Users", value: stats?.userCount ?? "—" },
    { label: "Posts", value: stats?.postCount ?? "—" },
  ];

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h5">Dashboard</Typography>
        <Typography variant="body2" color="text.secondary">
          Connected to <code>{API_BASE_URL}</code>
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {cards.map((card) => (
          <Grid key={card.label} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card variant="outlined">
              <CardContent>
                <Stack
                  direction="row"
                  sx={{ alignItems: "center", justifyContent: "space-between" }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {card.label}
                  </Typography>
                  {card.icon}
                </Stack>
                <Typography variant="h4" sx={{ mt: 1 }}>
                  {card.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            About this console
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            A Next.js + TypeScript admin console for the demo backend API. State
            is managed with React Context; requests are authorized with a JWT
            minted at login and sent as a Bearer token.
          </Typography>
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
            <Chip label="Next.js" size="small" />
            <Chip label="TypeScript" size="small" />
            <Chip label="MUI" size="small" />
            <Chip label="Context API" size="small" />
            <Chip label="Axios" size="small" />
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
