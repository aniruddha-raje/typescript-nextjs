// Typed wrappers around each FastAPI business endpoint.
import {
  api,
  type APIResponse,
  type JPComment,
  type JPPost,
  type Post,
  type Profile,
  type User,
} from "@/lib/api";

// ─── Meta (no auth) ───────────────────────────────────────────────────────────

export async function getHealthcheck(): Promise<{ status: string }> {
  const { data } = await api.get<APIResponse<{ status: string }>>(
    "/api/healthcheck",
  );
  return data.data;
}

export async function getVersion(): Promise<{ version: string }> {
  const { data } = await api.get<APIResponse<{ version: string }>>(
    "/api/version",
  );
  return data.data;
}

// ─── Users ─────────────────────────────────────────────────────────────────────

export async function listUsers(): Promise<User[]> {
  const { data } = await api.get<APIResponse<User[]>>("/users/");
  return data.data;
}

export async function getUser(userId: number): Promise<User> {
  const { data } = await api.get<APIResponse<User>>(`/users/${userId}`);
  return data.data;
}

export interface CreateUserPayload {
  username: string;
  profile?: { bio: string } | null;
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  const { data } = await api.post<APIResponse<User>>("/users/", payload);
  return data.data;
}

export async function deleteUser(
  userId: number,
): Promise<{ message: string }> {
  const { data } = await api.delete<APIResponse<{ message: string }>>(
    `/users/${userId}`,
  );
  return data.data;
}

// ─── Posts ─────────────────────────────────────────────────────────────────────

export async function listPosts(): Promise<Post[]> {
  const { data } = await api.get<APIResponse<Post[]>>("/posts/");
  return data.data;
}

export interface CreatePostPayload {
  title: string;
  content?: string | null;
}

export async function createPost(
  userId: number,
  payload: CreatePostPayload,
): Promise<Post> {
  // The backend takes user_id as a query param and also expects it in the body.
  const { data } = await api.post<APIResponse<Post>>(
    "/posts/",
    { ...payload, user_id: userId },
    { params: { user_id: userId } },
  );
  return data.data;
}

export interface UpdatePostPayload {
  title?: string;
  content?: string | null;
}

/**
 * Partially update a post (PATCH /posts/{id}).
 *
 * Only the keys present in `payload` are sent. The backend reads the body with
 * `exclude_unset`, so an omitted key leaves that field untouched, while an
 * explicit `content: null` clears it. A null `title` is rejected with a 422.
 */
export async function updatePost(
  postId: number,
  payload: UpdatePostPayload,
): Promise<Post> {
  const { data } = await api.patch<APIResponse<Post>>(
    `/posts/${postId}`,
    payload,
  );
  return data.data;
}

// ─── Profiles ────────────────────────────────────────────────────────────────

export async function getProfile(userId: number): Promise<Profile> {
  const { data } = await api.get<APIResponse<Profile>>(`/profiles/${userId}`);
  return data.data;
}

/**
 * Create or replace a user's profile (PUT /profiles/{user_id}).
 *
 * The backend upserts, so this also works for a user that has no profile yet;
 * it answers 201 on create and 200 on replace, which `created` reflects. A
 * user id that does not exist comes back as a 404.
 */
export async function upsertProfile(
  userId: number,
  bio: string,
): Promise<{ profile: Profile; created: boolean }> {
  const response = await api.put<APIResponse<Profile>>(`/profiles/${userId}`, {
    bio,
  });
  return { profile: response.data.data, created: response.status === 201 };
}

// ─── JSONPlaceholder proxy ───────────────────────────────────────────────────

export async function listJpPosts(): Promise<JPPost[]> {
  const { data } = await api.get<JPPost[]>("/jp/posts");
  return data;
}

export async function getJpPost(postId: number): Promise<JPPost> {
  const { data } = await api.get<JPPost>(`/jp/posts/${postId}`);
  return data;
}

export async function getJpPostComments(postId: number): Promise<JPComment[]> {
  const { data } = await api.get<JPComment[]>(`/jp/posts/${postId}/comments`);
  return data;
}

export interface JpPostBody {
  title: string;
  body: string;
  userId: number;
}

export async function createJpPost(body: JpPostBody): Promise<JPPost> {
  const { data } = await api.post<JPPost>("/jp/posts", body);
  return data;
}

export async function replaceJpPost(
  postId: number,
  body: JpPostBody,
): Promise<JPPost> {
  const { data } = await api.put<JPPost>(`/jp/posts/${postId}`, body);
  return data;
}

export async function updateJpPost(
  postId: number,
  body: JpPostBody,
): Promise<JPPost> {
  const { data } = await api.patch<JPPost>(`/jp/posts/${postId}`, body);
  return data;
}

export async function deleteJpPost(
  postId: number,
): Promise<{ success: boolean }> {
  const { data } = await api.delete<{ success: boolean }>(
    `/jp/posts/${postId}`,
  );
  return data;
}
