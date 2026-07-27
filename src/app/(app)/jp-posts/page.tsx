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
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import InputAdornment from "@mui/material/InputAdornment";
import AddIcon from "@mui/icons-material/Add";
import CommentIcon from "@mui/icons-material/Comment";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import { apiErrorMessage, type JPComment, type JPPost } from "@/lib/api";
import {
  createJpPost,
  deleteJpPost,
  getJpPost,
  getJpPostComments,
  listJpPosts,
  replaceJpPost,
} from "@/lib/services";

type EditState =
  | { mode: "create" }
  | { mode: "edit"; post: JPPost }
  | null;

export default function JpPostsPage() {
  const [posts, setPosts] = useState<JPPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Editor dialog.
  const [editState, setEditState] = useState<EditState>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [userIdField, setUserIdField] = useState("1");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Comments dialog.
  const [commentsFor, setCommentsFor] = useState<JPPost | null>(null);
  const [comments, setComments] = useState<JPComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  // Search-by-ID state.
  const [searchId, setSearchId] = useState("");
  const [searching, setSearching] = useState(false);
  const [filtered, setFiltered] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setFiltered(false);
    setSearchId("");
    setPage(0);
    try {
      setPosts(await listJpPosts());
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = async () => {
    const id = Number(searchId);
    if (!Number.isInteger(id) || id <= 0) return;
    setSearching(true);
    setError(null);
    try {
      const post = await getJpPost(id);
      setPosts([post]);
      setFiltered(true);
      setPage(0);
    } catch (e) {
      setPosts([]);
      setFiltered(true);
      setPage(0);
      setError(apiErrorMessage(e));
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditState({ mode: "create" });
    setTitle("");
    setBody("");
    setUserIdField("1");
    setFormError(null);
  };

  const openEdit = (post: JPPost) => {
    setEditState({ mode: "edit", post });
    setTitle(post.title);
    setBody(post.body);
    setUserIdField(String(post.userId));
    setFormError(null);
  };

  const handleSave = async () => {
    if (!editState) return;
    setSaving(true);
    setFormError(null);
    const payload = {
      title: title.trim(),
      body: body.trim(),
      userId: Number(userIdField) || 1,
    };
    try {
      if (editState.mode === "create") {
        await createJpPost(payload);
        setToast("Post created (mock — JSONPlaceholder does not persist)");
      } else {
        await replaceJpPost(editState.post.id, payload);
        setToast(`Post #${editState.post.id} updated (mock)`);
      }
      setEditState(null);
    } catch (e) {
      setFormError(apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (post: JPPost) => {
    try {
      await deleteJpPost(post.id);
      setToast(`Post #${post.id} deleted (mock)`);
    } catch (e) {
      setToast(apiErrorMessage(e));
    }
  };

  const openComments = async (post: JPPost) => {
    setCommentsFor(post);
    setCommentsLoading(true);
    setComments([]);
    try {
      setComments(await getJpPostComments(post.id));
    } catch (e) {
      setToast(apiErrorMessage(e));
    } finally {
      setCommentsLoading(false);
    }
  };

  const paged = posts.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  return (
    <Stack spacing={2}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="h5">JSONPlaceholder</Typography>
          <Typography variant="body2" color="text.secondary">
            Proxied through the backend <code>/jp</code> endpoints.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button startIcon={<RefreshIcon />} onClick={load} disabled={loading}>
            Refresh
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            New Post
          </Button>
        </Stack>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack
          component="form"
          direction="row"
          spacing={1}
          sx={{ alignItems: "center" }}
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
        >
          <TextField
            label="Search by post ID"
            size="small"
            value={searchId}
            onChange={(e) =>
              setSearchId(e.target.value.replace(/[^0-9]/g, ""))
            }
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ maxWidth: 240 }}
          />
          <Button
            type="submit"
            variant="outlined"
            disabled={!searchId || searching}
          >
            {searching ? "Searching…" : "Search"}
          </Button>
          {filtered && (
            <Button onClick={load} disabled={loading}>
              Clear
            </Button>
          )}
        </Stack>
      </Paper>

      {error && <Alert severity="error">{error}</Alert>}
      {filtered && !error && (
        <Alert severity="info">Showing result for post ID {searchId}.</Alert>
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
                <TableCell>User</TableCell>
                <TableCell>Title</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {posts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                      {filtered ? "No matching post." : "No posts."}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {paged.map((post) => (
                <TableRow key={post.id} hover>
                  <TableCell>{post.id}</TableCell>
                  <TableCell>{post.userId}</TableCell>
                  <TableCell sx={{ maxWidth: 480 }}>{post.title}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="View comments">
                      <IconButton onClick={() => openComments(post)}>
                        <CommentIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton onClick={() => openEdit(post)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton color="error" onClick={() => handleDelete(post)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={posts.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50]}
          />
        </TableContainer>
      )}

      {/* Editor dialog */}
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
            <TextField
              label="User ID"
              type="number"
              value={userIdField}
              onChange={(e) => setUserIdField(e.target.value)}
              slotProps={{ htmlInput: { min: 1 } }}
            />
            <TextField
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
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
            disabled={saving || !title.trim() || !body.trim()}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Comments dialog */}
      <Dialog
        open={Boolean(commentsFor)}
        onClose={() => setCommentsFor(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Comments — Post #{commentsFor?.id}</DialogTitle>
        <DialogContent dividers>
          {commentsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : comments.length === 0 ? (
            <Typography color="text.secondary">No comments.</Typography>
          ) : (
            <List disablePadding>
              {comments.map((c, i) => (
                <Box key={c.id}>
                  <ListItem alignItems="flex-start" disableGutters>
                    <ListItemText
                      primary={`${c.name} — ${c.email}`}
                      secondary={c.body}
                      slotProps={{ primary: { sx: { fontWeight: 600, fontSize: 14 } } }}
                    />
                  </ListItem>
                  {i < comments.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommentsFor(null)}>Close</Button>
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
