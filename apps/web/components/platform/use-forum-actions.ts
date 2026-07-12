import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import type { ApiState, ForumPost } from "@/components/platform/types";

type ApiFetch = <T>(path: string, init?: RequestInit, token?: string) => Promise<T>;

type UseForumActionsParams = {
  state: ApiState;
  setState: Dispatch<SetStateAction<ApiState>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setMessage: Dispatch<SetStateAction<string>>;
  apiFetch: ApiFetch;
};

export function useForumActions({ state, setState, setLoading, setMessage, apiFetch }: UseForumActionsParams) {
  const [forumTitle, setForumTitle] = useState("");
  const [forumContent, setForumContent] = useState("");
  const [forumComment, setForumComment] = useState("");

  async function loadForumPosts() {
    setLoading(true);
    setMessage("");
    try {
      const data = await apiFetch<{ posts: ForumPost[] }>("/forum-posts");
      setState((current) => ({
        ...current,
        forumPosts: data.posts
      }));
      if (data.posts[0]) {
        void loadForumPost(data.posts[0].id);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "加载社区帖子失败");
    } finally {
      setLoading(false);
    }
  }

  async function loadForumPost(id: string) {
    setLoading(true);
    setMessage("");
    try {
      const data = await apiFetch<{ post: ForumPost }>(`/forum-posts/${id}`);
      setState((current) => ({
        ...current,
        selectedForumPost: data.post,
        forumPosts: current.forumPosts.map((item) =>
          item.id === data.post.id ? { ...item, comment_count: data.post.comment_count } : item
        )
      }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "加载帖子详情失败");
    } finally {
      setLoading(false);
    }
  }

  async function createForumPost() {
    if (!state.token) {
      setMessage("请先登录");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const data = await apiFetch<{ post: ForumPost }>("/forum-posts", {
        method: "POST",
        body: JSON.stringify({ title: forumTitle, content: forumContent })
      });
      setForumTitle("");
      setForumContent("");
      await loadForumPosts();
      await loadForumPost(data.post.id);
      setMessage("帖子已发布");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "发布帖子失败");
    } finally {
      setLoading(false);
    }
  }

  async function archiveForumPost(id: string) {
    if (!state.token) {
      setMessage("请先登录");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      await apiFetch(`/forum-posts/${id}`, { method: "DELETE" });
      setState((current) => ({ ...current, selectedForumPost: null }));
      await loadForumPosts();
      setMessage("帖子已删除");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "删除帖子失败");
    } finally {
      setLoading(false);
    }
  }

  async function createForumComment() {
    if (!state.token || !state.selectedForumPost) {
      setMessage("请先登录并选择帖子");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      await apiFetch(`/forum-posts/${state.selectedForumPost.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: forumComment })
      });
      setForumComment("");
      await loadForumPost(state.selectedForumPost.id);
      setMessage("评论已发布");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "发布评论失败");
    } finally {
      setLoading(false);
    }
  }

  async function archiveForumComment(id: string) {
    if (!state.token || !state.selectedForumPost) {
      setMessage("请先登录并选择帖子");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      await apiFetch(`/forum-comments/${id}`, { method: "DELETE" });
      await loadForumPost(state.selectedForumPost.id);
      setMessage("评论已删除");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "删除评论失败");
    } finally {
      setLoading(false);
    }
  }

  return {
    forumTitle,
    setForumTitle,
    forumContent,
    setForumContent,
    forumComment,
    setForumComment,
    loadForumPosts,
    loadForumPost,
    createForumPost,
    archiveForumPost,
    createForumComment,
    archiveForumComment
  };
}
