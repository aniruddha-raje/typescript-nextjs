"use client";

import { useCallback, useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";
import { apiErrorMessage, type Post, type User } from "@/lib/api";
import {
  createPost,
  listPosts,
  listUsers,
  updatePost,
  type UpdatePostPayload,
} from "@/lib/services";

type EditState = { mode: "create" } | { mode: "edit"; post: Post } | null;

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Editor dialog — shared by create and edit.
  const [editState, setEditState] = useState<EditState>(null);
  const [userId, setUserId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [postsData, usersData] = await Promise.all([
        listPosts(),
        listUsers(),
      ]);
      setPosts(postsData);
      setUsers(usersData);
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditState({ mode: "create" });
    setUserId("");
    setTitle("");
    setContent("");
    setFormError(null);
  };

  const openEdit = (post: Post) => {
    setEditState({ mode: "edit", post });
    setTitle(post.title);
    setContent(post.content ?? "");
    setFormError(null);
  };

  const handleSave = async () => {
    if (!editState) return;
    setSaving(true);
    setFormError(null);
    try {
      if (editState.mode === "create") {
        await createPost(Number(userId), {
          title: title.trim(),
          content: content.trim() || null,
        });
        setToast("Post created");
      } else {
        const { post } = editState;
        // PATCH is partial: send only what actually changed, so untouched
        // fields keep their stored value.
        const nextTitle = title.trim();
        const nextContent = content.trim() || null;
        const payload: UpdatePostPayload = {};
        if (nextTitle !== post.title) payload.title = nextTitle;
        if (nextContent !== (post.content ?? null)) payload.content = nextContent;

        if (Object.keys(payload).length === 0) {
          setEditState(null);
          setSaving(false);
          return;
        }
        await updatePost(post.id, payload);
        setToast(`Post #${post.id} updated`);
      }
      setEditState(null);
      await load();
    } catch (e) {
      setFormError(apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h5">Posts</Typography>
        <Stack direction="row" spacing={1}>
          <Button startIcon={<RefreshIcon />} onClick={load} disabled={loading}>
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreate}
            disabled={users.length === 0}
          >
            New Post
          </Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}
      {!loading && users.length === 0 && !error && (
        <Alert severity="info">Create a user first to add posts.</Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Content</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {posts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                      No posts yet.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                posts.map((post) => (
                  <TableRow key={post.id} hover>
                    <TableCell>{post.id}</TableCell>
                    <TableCell>{post.title}</TableCell>
                    <TableCell>{post.content ?? "—"}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit post">
                        <IconButton
                          size="small"
                          onClick={() => openEdit(post)}
                          aria-label={`Edit post ${post.id}`}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog
        open={Boolean(editState)}
        onClose={() => !saving && setEditState(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editState?.mode === "edit"
            ? `Edit Post #${editState.post.id}`
            : "Create Post"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            {editState?.mode === "create" && (
              <TextField
                select
                label="Author"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                fullWidth
                required
              >
                {users.map((u) => (
                  <MenuItem key={u.id} value={String(u.id)}>
                    {u.username} (#{u.id})
                  </MenuItem>
                ))}
              </TextField>
            )}
            <TextField
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              fullWidth
              multiline
              minRows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditState(null)} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={
              saving ||
              !title.trim() ||
              (editState?.mode === "create" && !userId)
            }
          >
            {saving
              ? "Saving…"
              : editState?.mode === "edit"
                ? "Save changes"
                : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

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
