import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import type { ApiState, Article, ArticleCategory } from "@/components/platform/types";

type ApiFetch = <T>(path: string, init?: RequestInit, token?: string) => Promise<T>;

type UseArticleActionsParams = {
  state: ApiState;
  setState: Dispatch<SetStateAction<ApiState>>;
  canEditArticles: boolean;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setMessage: Dispatch<SetStateAction<string>>;
  apiFetch: ApiFetch;
  uploadImage: (file: File) => Promise<string>;
};

export function useArticleActions({
  state,
  setState,
  canEditArticles,
  setLoading,
  setMessage,
  apiFetch,
  uploadImage
}: UseArticleActionsParams) {
  const [editingArticleId, setEditingArticleId] = useState("");
  const [articleCategory, setArticleCategory] = useState("心理科普");
  const [categoryName, setCategoryName] = useState("心理科普");
  const [editingCategoryId, setEditingCategoryId] = useState("");
  const [articleTitle, setArticleTitle] = useState("");
  const [articleSummary, setArticleSummary] = useState("");
  const [articleContent, setArticleContent] = useState("");
  const [articleCoverURL, setArticleCoverURL] = useState("");

  async function loadArticles() {
    setLoading(true);
    setMessage("");
    try {
      const data = await apiFetch<{ articles: Article[] }>("/articles");
      setState((current) => ({
        ...current,
        articles: data.articles
      }));
      if (data.articles[0]) {
        void loadArticle(data.articles[0].id);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "加载健康知识失败");
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    setLoading(true);
    setMessage("");
    try {
      const data = await apiFetch<{ categories: ArticleCategory[] }>("/article-categories");
      setState((current) => ({
        ...current,
        categories: data.categories
      }));
      if (data.categories[0]) {
        setArticleCategory((current) => current || data.categories[0].name);
        setCategoryName((current) => current || data.categories[0].name);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "加载文章分类失败");
    } finally {
      setLoading(false);
    }
  }

  async function loadArticle(id: string) {
    setLoading(true);
    setMessage("");
    try {
      const data = await apiFetch<{ article: Article }>(`/articles/${id}`);
      setState((current) => ({
        ...current,
        selectedArticle: data.article,
        articles: current.articles.map((item) => (item.id === data.article.id ? { ...item, view_count: data.article.view_count } : item))
      }));
      setEditingArticleId(data.article.id);
      setArticleCategory(data.article.category ?? "心理科普");
      setCategoryName(data.article.category ?? "心理科普");
      setArticleTitle(data.article.title);
      setArticleSummary(data.article.summary ?? "");
      setArticleContent(data.article.content ?? "");
      setArticleCoverURL(data.article.cover_url ?? "");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "加载文章详情失败");
    } finally {
      setLoading(false);
    }
  }

  async function saveArticle() {
    if (!state.token || !canEditArticles) {
      setMessage("需要管理员或咨询师账号");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const path = editingArticleId ? `/articles/${editingArticleId}` : "/articles";
      const method = editingArticleId ? "PUT" : "POST";
      const data = await apiFetch<{ article: Article }>(path, {
        method,
        body: JSON.stringify({
          category: articleCategory,
          title: articleTitle,
          summary: articleSummary,
          content: articleContent,
          cover_url: articleCoverURL,
          status: "published"
        })
      });
      await loadArticles();
      await loadArticle(data.article.id);
      setMessage(editingArticleId ? "文章已更新" : "文章已创建");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存文章失败");
    } finally {
      setLoading(false);
    }
  }

  async function uploadArticleCover(file: File | null) {
    if (!file) {
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const url = await uploadImage(file);
      setArticleCoverURL(url);
      setMessage("封面已上传，保存文章后生效");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "上传封面失败");
    } finally {
      setLoading(false);
    }
  }

  async function saveCategory() {
    if (!state.token || !canEditArticles) {
      setMessage("需要管理员或咨询师账号");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const path = editingCategoryId ? `/article-categories/${editingCategoryId}` : "/article-categories";
      const method = editingCategoryId ? "PUT" : "POST";
      const data = await apiFetch<{ category: ArticleCategory }>(path, {
        method,
        body: JSON.stringify({ name: categoryName })
      });
      await loadCategories();
      setArticleCategory(data.category.name);
      setCategoryName(data.category.name);
      setEditingCategoryId("");
      setMessage(editingCategoryId ? "分类已更新" : "分类已创建");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存分类失败");
    } finally {
      setLoading(false);
    }
  }

  async function disableCategory(id: string, name: string) {
    if (!state.token || !canEditArticles) {
      setMessage("需要管理员或咨询师账号");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      await apiFetch(`/article-categories/${id}`, { method: "DELETE" });
      await loadCategories();
      if (articleCategory === name) {
        setArticleCategory("");
      }
      if (editingCategoryId === id) {
        setEditingCategoryId("");
        setCategoryName("");
      }
      setMessage("分类已停用");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "停用分类失败");
    } finally {
      setLoading(false);
    }
  }

  async function archiveArticle() {
    if (!state.token || !canEditArticles || !editingArticleId) {
      setMessage("请选择可归档的文章");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      await apiFetch(`/articles/${editingArticleId}`, { method: "DELETE" });
      setEditingArticleId("");
      setArticleTitle("");
      setArticleSummary("");
      setArticleContent("");
      setArticleCoverURL("");
      setState((current) => ({ ...current, selectedArticle: null }));
      await loadArticles();
      setMessage("文章已归档");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "归档文章失败");
    } finally {
      setLoading(false);
    }
  }

  return {
    articleCategory,
    setArticleCategory,
    categoryName,
    setCategoryName,
    editingCategoryId,
    setEditingCategoryId,
    editingArticleId,
    setEditingArticleId,
    articleTitle,
    setArticleTitle,
    articleSummary,
    setArticleSummary,
    articleContent,
    setArticleContent,
    articleCoverURL,
    setArticleCoverURL,
    loadArticles,
    loadCategories,
    loadArticle,
    saveArticle,
    uploadArticleCover,
    saveCategory,
    disableCategory,
    archiveArticle
  };
}
