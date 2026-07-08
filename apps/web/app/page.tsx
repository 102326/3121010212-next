"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  ImagePlus,
  LibraryBig,
  LogIn,
  Pencil,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  UserRoundCheck
} from "lucide-react";

import { Button } from "@/components/ui/button";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8080/api/v1";

type User = {
  id: string;
  username: string;
  role: string;
  display_name: string;
  phone?: string;
};

type Counselor = {
  id: string;
  name: string;
  gender?: string;
  avatar_url?: string;
  specialty: string;
  available_time?: string;
  phone?: string;
  bio?: string;
  rating: string;
};

type Appointment = {
  id: string;
  student_name: string;
  counselor_name: string;
  scheduled_at: string;
  content: string;
  status: string;
  created_at: string;
};

type Article = {
  id: string;
  category?: string;
  author?: string;
  title: string;
  summary?: string;
  content?: string;
  cover_url?: string;
  view_count: number;
  published_at?: string;
};

type ArticleCategory = {
  id: string;
  name: string;
  is_active: boolean;
};

type ApiState = {
  token: string;
  user: User | null;
  counselors: Counselor[];
  appointments: Appointment[];
  articles: Article[];
  categories: ArticleCategory[];
  selectedArticle: Article | null;
};

const statusText: Record<string, string> = {
  pending: "待确认",
  approved: "已确认",
  cancelled: "已取消",
  completed: "已完成"
};

export default function Home() {
  const [state, setState] = useState<ApiState>({
    token: "",
    user: null,
    counselors: [],
    appointments: [],
    articles: [],
    categories: [],
    selectedArticle: null
  });
  const [username, setUsername] = useState("student-demo");
  const [password, setPassword] = useState("123456");
  const [selectedCounselor, setSelectedCounselor] = useState("");
  const [scheduledAt, setScheduledAt] = useState("2026-07-05T14:00");
  const [content, setContent] = useState("最近睡眠不好，想预约咨询。");
  const [counselorName, setCounselorName] = useState("");
  const [counselorGender, setCounselorGender] = useState("");
  const [counselorSpecialty, setCounselorSpecialty] = useState("");
  const [counselorAvailableTime, setCounselorAvailableTime] = useState("");
  const [counselorPhone, setCounselorPhone] = useState("");
  const [counselorBio, setCounselorBio] = useState("");
  const [counselorAvatarURL, setCounselorAvatarURL] = useState("");
  const [editingArticleId, setEditingArticleId] = useState("");
  const [articleCategory, setArticleCategory] = useState("心理科普");
  const [categoryName, setCategoryName] = useState("心理科普");
  const [editingCategoryId, setEditingCategoryId] = useState("");
  const [articleTitle, setArticleTitle] = useState("");
  const [articleSummary, setArticleSummary] = useState("");
  const [articleContent, setArticleContent] = useState("");
  const [articleCoverURL, setArticleCoverURL] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const canEditArticles = state.user?.role === "admin" || state.user?.role === "counselor";
  const canManageAppointments = state.user?.role === "admin" || state.user?.role === "counselor";
  const canManageCounselors = state.user?.role === "admin" || state.user?.role === "counselor";

  const activeCounselor = useMemo(
    () => state.counselors.find((item) => item.id === selectedCounselor) ?? null,
    [selectedCounselor, state.counselors]
  );

  const stats = useMemo(
    () => [
      { name: "咨询师", value: String(state.counselors.length), icon: UserRoundCheck },
      { name: "我的预约", value: String(state.appointments.length), icon: CalendarCheck },
      { name: "健康知识", value: String(state.articles.length), icon: LibraryBig },
      { name: "待确认", value: String(state.appointments.filter((item) => item.status === "pending").length), icon: Clock3 }
    ],
    [state.appointments, state.articles.length, state.counselors.length]
  );

  useEffect(() => {
    void loadCounselors();
    void loadCategories();
    void loadArticles();
  }, []);

  useEffect(() => {
    if (!activeCounselor) {
      return;
    }
    setCounselorName(activeCounselor.name);
    setCounselorGender(activeCounselor.gender ?? "");
    setCounselorSpecialty(activeCounselor.specialty);
    setCounselorAvailableTime(activeCounselor.available_time ?? "");
    setCounselorPhone(activeCounselor.phone ?? "");
    setCounselorBio(activeCounselor.bio ?? "");
    setCounselorAvatarURL(activeCounselor.avatar_url ?? "");
  }, [activeCounselor]);

  async function apiFetch<T>(path: string, init: RequestInit = {}, token = state.token): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("Content-Type", "application/json");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${API_BASE}${path}`, { ...init, headers });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      throw new Error(data.error ?? `HTTP ${response.status}`);
    }
    return data as T;
  }

  async function uploadImage(file: File) {
    if (!state.token) {
      throw new Error("请先登录");
    }
    const form = new FormData();
    form.append("file", file);

    const response = await fetch(`${API_BASE}/uploads`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${state.token}`
      },
      body: form
    });
    const data = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
    if (!response.ok || !data.url) {
      throw new Error(data.error ?? "上传失败");
    }
    return data.url;
  }

  async function loadCounselors() {
    setLoading(true);
    setMessage("");
    try {
      const data = await apiFetch<{ counselors: Counselor[] }>("/counselors");
      setState((current) => ({
        ...current,
        counselors: data.counselors
      }));
      if (data.counselors[0]) {
        setSelectedCounselor((current) => current || data.counselors[0].id);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "加载咨询师失败");
    } finally {
      setLoading(false);
    }
  }

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

  async function loadAppointments(token = state.token) {
    if (!token) {
      return;
    }
    const headers = new Headers({ Authorization: `Bearer ${token}` });
    const response = await fetch(`${API_BASE}/appointments`, { headers });
    const data = (await response.json().catch(() => ({}))) as { appointments?: Appointment[]; error?: string };
    if (!response.ok) {
      throw new Error(data.error ?? "加载预约失败");
    }
    setState((current) => ({
      ...current,
      appointments: data.appointments ?? []
    }));
  }

  async function login() {
    setLoading(true);
    setMessage("");
    try {
      const data = await apiFetch<{ token: string; user: User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password })
      });
      setState((current) => ({ ...current, token: data.token, user: data.user }));
      await loadAppointments(data.token);
      setMessage(`已登录：${data.user.display_name}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "登录失败");
    } finally {
      setLoading(false);
    }
  }

  async function createAppointment() {
    if (!state.token) {
      setMessage("请先登录");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      await apiFetch("/appointments", {
        method: "POST",
        body: JSON.stringify({
          counselor_id: selectedCounselor,
          scheduled_at: new Date(scheduledAt).toISOString(),
          content
        })
      });
      await loadAppointments();
      setMessage("预约已提交");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "预约失败");
    } finally {
      setLoading(false);
    }
  }

  async function updateAppointmentStatus(id: string, status: string) {
    if (!state.token || !canManageAppointments) {
      setMessage("需要管理员或咨询师账号");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      await apiFetch(`/appointments/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      await loadAppointments();
      setMessage(`预约状态已更新为：${statusText[status] ?? status}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "更新预约状态失败");
    } finally {
      setLoading(false);
    }
  }

  async function saveCounselorProfile() {
    if (!state.token || !canManageCounselors || !selectedCounselor) {
      setMessage("需要管理员或咨询师账号，并选择咨询师");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const data = await apiFetch<{ counselor: Counselor }>(`/counselors/${selectedCounselor}`, {
        method: "PUT",
        body: JSON.stringify({
          name: counselorName,
          gender: counselorGender,
          avatar_url: counselorAvatarURL,
          specialty: counselorSpecialty,
          available_time: counselorAvailableTime,
          phone: counselorPhone,
          bio: counselorBio
        })
      });
      await loadCounselors();
      setSelectedCounselor(data.counselor.id);
      setMessage("咨询师资料已更新");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存咨询师资料失败");
    } finally {
      setLoading(false);
    }
  }

  async function uploadCounselorAvatar(file: File | null) {
    if (!file) {
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const url = await uploadImage(file);
      setCounselorAvatarURL(url);
      setMessage("头像已上传，保存资料后生效");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "上传头像失败");
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

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Activity className="size-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">3121010212-next</p>
              <h1 className="text-lg font-semibold">心理健康服务平台</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {state.user ? state.user.display_name : "未登录"}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-4">
          <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">账号</h2>
              <LogIn className="size-4 text-primary" />
            </div>
            <div className="space-y-3">
              <label className="block text-sm">
                <span className="mb-1 block text-muted-foreground">用户名</span>
                <input
                  className="h-10 w-full rounded-md border border-border px-3 outline-none focus:ring-2 focus:ring-primary"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-muted-foreground">密码</span>
                <input
                  className="h-10 w-full rounded-md border border-border px-3 outline-none focus:ring-2 focus:ring-primary"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>
              <Button className="w-full gap-2" disabled={loading} onClick={login}>
                <LogIn className="size-4" />
                登录
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">预约</h2>
              <Send className="size-4 text-primary" />
            </div>
            <div className="space-y-3">
              <label className="block text-sm">
                <span className="mb-1 block text-muted-foreground">咨询师</span>
                <select
                  className="h-10 w-full rounded-md border border-border px-3 outline-none focus:ring-2 focus:ring-primary"
                  value={selectedCounselor}
                  onChange={(event) => setSelectedCounselor(event.target.value)}
                >
                  {state.counselors.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-muted-foreground">时间</span>
                <input
                  className="h-10 w-full rounded-md border border-border px-3 outline-none focus:ring-2 focus:ring-primary"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(event) => setScheduledAt(event.target.value)}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-muted-foreground">内容</span>
                <textarea
                  className="min-h-24 w-full rounded-md border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                />
              </label>
              <Button className="w-full gap-2" disabled={loading || !selectedCounselor} onClick={createAppointment}>
                <CalendarCheck className="size-4" />
                提交预约
              </Button>
            </div>
          </div>

          {canManageCounselors ? (
            <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold">咨询师资料</h2>
                <UserRoundCheck className="size-4 text-primary" />
              </div>
              <div className="space-y-3">
                <label className="block text-sm">
                  <span className="mb-1 block text-muted-foreground">当前咨询师</span>
                  <select
                    className="h-10 w-full rounded-md border border-border px-3 outline-none focus:ring-2 focus:ring-primary"
                    value={selectedCounselor}
                    onChange={(event) => setSelectedCounselor(event.target.value)}
                  >
                    {state.counselors.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-muted-foreground">姓名</span>
                  <input
                    className="h-10 w-full rounded-md border border-border px-3 outline-none focus:ring-2 focus:ring-primary"
                    value={counselorName}
                    onChange={(event) => setCounselorName(event.target.value)}
                  />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block text-sm">
                    <span className="mb-1 block text-muted-foreground">性别</span>
                    <input
                      className="h-10 w-full rounded-md border border-border px-3 outline-none focus:ring-2 focus:ring-primary"
                      value={counselorGender}
                      onChange={(event) => setCounselorGender(event.target.value)}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block text-muted-foreground">电话</span>
                    <input
                      className="h-10 w-full rounded-md border border-border px-3 outline-none focus:ring-2 focus:ring-primary"
                      value={counselorPhone}
                      onChange={(event) => setCounselorPhone(event.target.value)}
                    />
                  </label>
                </div>
                <label className="block text-sm">
                  <span className="mb-1 block text-muted-foreground">专长</span>
                  <input
                    className="h-10 w-full rounded-md border border-border px-3 outline-none focus:ring-2 focus:ring-primary"
                    value={counselorSpecialty}
                    onChange={(event) => setCounselorSpecialty(event.target.value)}
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-muted-foreground">可预约时间</span>
                  <input
                    className="h-10 w-full rounded-md border border-border px-3 outline-none focus:ring-2 focus:ring-primary"
                    value={counselorAvailableTime}
                    onChange={(event) => setCounselorAvailableTime(event.target.value)}
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-muted-foreground">头像 URL</span>
                  <input
                    className="h-10 w-full rounded-md border border-border px-3 outline-none focus:ring-2 focus:ring-primary"
                    value={counselorAvatarURL}
                    onChange={(event) => setCounselorAvatarURL(event.target.value)}
                  />
                </label>
                <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-border text-sm transition-colors hover:bg-muted">
                  <ImagePlus className="size-4 text-primary" />
                  上传头像
                  <input
                    className="hidden"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(event) => void uploadCounselorAvatar(event.target.files?.[0] ?? null)}
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-muted-foreground">简介</span>
                  <textarea
                    className="min-h-24 w-full rounded-md border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                    value={counselorBio}
                    onChange={(event) => setCounselorBio(event.target.value)}
                  />
                </label>
                <Button
                  className="w-full gap-2"
                  disabled={loading || !selectedCounselor || !counselorName.trim() || !counselorSpecialty.trim()}
                  onClick={saveCounselorProfile}
                >
                  <Send className="size-4" />
                  保存资料
                </Button>
              </div>
            </div>
          ) : null}

          {canEditArticles ? (
            <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold">分类管理</h2>
                <Plus className="size-4 text-primary" />
              </div>
              <div className="space-y-3">
                <label className="block text-sm">
                  <span className="mb-1 block text-muted-foreground">分类名称</span>
                  <input
                    className="h-10 w-full rounded-md border border-border px-3 outline-none focus:ring-2 focus:ring-primary"
                    value={categoryName}
                    onChange={(event) => setCategoryName(event.target.value)}
                  />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Button className="gap-2" disabled={loading || !categoryName.trim()} onClick={saveCategory}>
                    <Plus className="size-4" />
                    {editingCategoryId ? "保存分类" : "新增分类"}
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={loading}
                    onClick={() => {
                      setEditingCategoryId("");
                      setCategoryName("");
                    }}
                  >
                    清空
                  </Button>
                </div>
                <div className="space-y-2">
                  {state.categories.length === 0 ? (
                    <p className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">暂无分类</p>
                  ) : (
                    state.categories.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
                        <button
                          className="min-w-0 flex-1 truncate text-left text-sm"
                          onClick={() => {
                            setEditingCategoryId(item.id);
                            setCategoryName(item.name);
                          }}
                        >
                          {item.name}
                        </button>
                        <Button
                          className="size-8 p-0"
                          variant="ghost"
                          disabled={loading}
                          onClick={() => {
                            setEditingCategoryId(item.id);
                            setCategoryName(item.name);
                          }}
                          aria-label={`编辑分类 ${item.name}`}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          className="size-8 p-0"
                          variant="ghost"
                          disabled={loading}
                          onClick={() => void disableCategory(item.id, item.name)}
                          aria-label={`停用分类 ${item.name}`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {canEditArticles ? (
            <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold">文章编辑</h2>
                <LibraryBig className="size-4 text-primary" />
              </div>
              <div className="space-y-3">
                <label className="block text-sm">
                  <span className="mb-1 block text-muted-foreground">分类</span>
                  <select
                    className="h-10 w-full rounded-md border border-border px-3 outline-none focus:ring-2 focus:ring-primary"
                    value={articleCategory}
                    onChange={(event) => setArticleCategory(event.target.value)}
                  >
                    {state.categories.length === 0 ? <option value="">暂无分类</option> : null}
                    {state.categories.map((item) => (
                      <option key={item.id} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-muted-foreground">标题</span>
                  <input
                    className="h-10 w-full rounded-md border border-border px-3 outline-none focus:ring-2 focus:ring-primary"
                    value={articleTitle}
                    onChange={(event) => setArticleTitle(event.target.value)}
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-muted-foreground">摘要</span>
                  <textarea
                    className="min-h-20 w-full rounded-md border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                    value={articleSummary}
                    onChange={(event) => setArticleSummary(event.target.value)}
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-muted-foreground">正文</span>
                  <textarea
                    className="min-h-28 w-full rounded-md border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                    value={articleContent}
                    onChange={(event) => setArticleContent(event.target.value)}
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-muted-foreground">封面 URL</span>
                  <input
                    className="h-10 w-full rounded-md border border-border px-3 outline-none focus:ring-2 focus:ring-primary"
                    value={articleCoverURL}
                    onChange={(event) => setArticleCoverURL(event.target.value)}
                  />
                </label>
                <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-border text-sm transition-colors hover:bg-muted">
                  <ImagePlus className="size-4 text-primary" />
                  上传封面
                  <input
                    className="hidden"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(event) => void uploadArticleCover(event.target.files?.[0] ?? null)}
                  />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Button className="gap-2" disabled={loading || !articleTitle || !articleContent} onClick={saveArticle}>
                    <Send className="size-4" />
                    保存
                  </Button>
                  <Button variant="outline" disabled={loading || !editingArticleId} onClick={archiveArticle}>
                    归档
                  </Button>
                </div>
                <Button
                  className="w-full"
                  variant="ghost"
                  onClick={() => {
                    setEditingArticleId("");
                    setArticleCategory(state.categories[0]?.name ?? "");
                    setArticleTitle("");
                    setArticleSummary("");
                    setArticleContent("");
                    setArticleCoverURL("");
                  }}
                >
                  新建文章
                </Button>
              </div>
            </div>
          ) : null}
        </aside>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-primary">Go API + PostgreSQL</p>
                <h2 className="mt-1 text-2xl font-semibold">核心预约闭环</h2>
              </div>
              <Button
                className="gap-2"
                variant="outline"
                disabled={loading}
                onClick={() => {
                  void loadCounselors();
                  void loadCategories();
                  void loadArticles();
                }}
              >
                <RefreshCw className="size-4" />
                刷新
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              {stats.map((item) => (
                <div key={item.name} className="rounded-md border border-border p-4">
                  <item.icon className="mb-4 size-5 text-primary" />
                  <p className="text-2xl font-semibold">{item.value}</p>
                  <p className="text-sm text-muted-foreground">{item.name}</p>
                </div>
              ))}
            </div>
            {message ? <p className="mt-4 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">{message}</p> : null}
          </div>

          <section className="grid gap-4 xl:grid-cols-3">
            <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-semibold">咨询师</h2>
              <div className="space-y-3">
                {state.counselors.map((item) => (
                  <button
                    key={item.id}
                    className="w-full rounded-md border border-border p-4 text-left transition-colors hover:bg-muted"
                    onClick={() => setSelectedCounselor(item.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{item.specialty}</p>
                      </div>
                      <span className="rounded-md bg-muted px-2 py-1 text-sm text-primary">{item.rating}</span>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">{item.available_time}</p>
                    <p className="mt-2 text-sm leading-6">{item.bio}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold">我的预约</h2>
                <CheckCircle2 className="size-4 text-primary" />
              </div>
              <div className="space-y-3">
                {state.appointments.length === 0 ? (
                  <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">暂无预约记录</p>
                ) : (
                  state.appointments.map((item) => (
                    <div key={item.id} className="rounded-md border border-border p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium">{item.counselor_name}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{new Date(item.scheduled_at).toLocaleString()}</p>
                        </div>
                        <span className="rounded-md bg-muted px-2 py-1 text-sm text-primary">{statusText[item.status] ?? item.status}</span>
                      </div>
                      <p className="mt-3 text-sm leading-6">{item.content}</p>
                      {canManageAppointments ? (
                        <div className="mt-4 grid grid-cols-3 gap-2">
                          <Button
                            variant={item.status === "approved" ? "default" : "outline"}
                            disabled={loading || item.status === "approved"}
                            onClick={() => void updateAppointmentStatus(item.id, "approved")}
                          >
                            确认
                          </Button>
                          <Button
                            variant={item.status === "completed" ? "default" : "outline"}
                            disabled={loading || item.status === "completed"}
                            onClick={() => void updateAppointmentStatus(item.id, "completed")}
                          >
                            完成
                          </Button>
                          <Button
                            variant={item.status === "cancelled" ? "default" : "outline"}
                            disabled={loading || item.status === "cancelled"}
                            onClick={() => void updateAppointmentStatus(item.id, "cancelled")}
                          >
                            取消
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold">健康知识</h2>
                <LibraryBig className="size-4 text-primary" />
              </div>
              <div className="space-y-3">
                {state.articles.length === 0 ? (
                  <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">暂无文章</p>
                ) : (
                  state.articles.map((item) => (
                    <button
                      key={item.id}
                      className="w-full rounded-md border border-border p-4 text-left transition-colors hover:bg-muted"
                      onClick={() => void loadArticle(item.id)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{item.category}</p>
                        </div>
                        <span className="rounded-md bg-muted px-2 py-1 text-sm text-primary">{item.view_count}</span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.summary}</p>
                      {item.cover_url ? (
                        <div className="mt-3 aspect-video overflow-hidden rounded-md border border-border bg-muted">
                          <img className="h-full w-full object-cover" src={item.cover_url} alt={item.title} />
                        </div>
                      ) : null}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-semibold">文章详情</h2>
              {state.selectedArticle ? (
                <article>
                  <div className="mb-3 flex flex-wrap gap-2 text-sm text-muted-foreground">
                    <span>{state.selectedArticle.category}</span>
                    <span>{state.selectedArticle.author}</span>
                    <span>浏览 {state.selectedArticle.view_count}</span>
                  </div>
                  {state.selectedArticle.cover_url ? (
                    <div className="mb-4 aspect-video overflow-hidden rounded-md border border-border bg-muted">
                      <img className="h-full w-full object-cover" src={state.selectedArticle.cover_url} alt={state.selectedArticle.title} />
                    </div>
                  ) : null}
                  <h3 className="text-lg font-semibold">{state.selectedArticle.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{state.selectedArticle.summary}</p>
                  <p className="mt-4 text-sm leading-7">{state.selectedArticle.content}</p>
                </article>
              ) : (
                <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">选择一篇文章查看详情</p>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
