"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ClipboardCheck,
  CalendarCheck,
  Clock3,
  LibraryBig,
  MessageSquareText,
  UserRoundCheck
} from "lucide-react";

import { apiFetchJson, uploadImageFile } from "@/components/platform/api";
import { AppHeader } from "@/components/platform/app-header";
import { DashboardSummary } from "@/components/platform/dashboard-summary";
import { MainContentPanels } from "@/components/platform/main-panels";
import { PlatformSidebar } from "@/components/platform/sidebar";
import { statusText } from "@/components/platform/types";
import { useArticleActions } from "@/components/platform/use-article-actions";
import type {
  ApiState,
  Appointment,
  AssessmentQuestion,
  AssessmentSubmission,
  Counselor,
  DashboardMetric,
  ForumPost,
  User
} from "@/components/platform/types";

export default function Home() {
  const [state, setState] = useState<ApiState>({
    token: "",
    user: null,
    counselors: [],
    appointments: [],
    articles: [],
    categories: [],
    forumPosts: [],
    assessmentQuestions: [],
    assessmentSubmissions: [],
    latestAssessment: null,
    selectedForumPost: null,
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
  const [forumTitle, setForumTitle] = useState("");
  const [forumContent, setForumContent] = useState("");
  const [forumComment, setForumComment] = useState("");
  const [assessmentAnswers, setAssessmentAnswers] = useState<Record<string, number>>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const canEditArticles = state.user?.role === "admin" || state.user?.role === "counselor";
  const canManageAppointments = state.user?.role === "admin" || state.user?.role === "counselor";
  const canManageCounselors = state.user?.role === "admin" || state.user?.role === "counselor";

  const activeCounselor = useMemo(
    () => state.counselors.find((item) => item.id === selectedCounselor) ?? null,
    [selectedCounselor, state.counselors]
  );

  const stats = useMemo<DashboardMetric[]>(
    () => [
      { name: "咨询师", value: String(state.counselors.length), icon: UserRoundCheck },
      { name: "我的预约", value: String(state.appointments.length), icon: CalendarCheck },
      { name: "健康知识", value: String(state.articles.length), icon: LibraryBig },
      { name: "社区帖子", value: String(state.forumPosts.length), icon: MessageSquareText },
      { name: "测评题目", value: String(state.assessmentQuestions.length), icon: ClipboardCheck },
      { name: "待确认", value: String(state.appointments.filter((item) => item.status === "pending").length), icon: Clock3 }
    ],
    [state.appointments, state.articles.length, state.assessmentQuestions.length, state.counselors.length, state.forumPosts.length]
  );

  const articleActions = useArticleActions({
    state,
    setState,
    canEditArticles,
    setLoading,
    setMessage,
    apiFetch,
    uploadImage
  });

  useEffect(() => {
    void loadCounselors();
    void articleActions.loadCategories();
    void articleActions.loadArticles();
    void loadForumPosts();
    void loadAssessmentQuestions();
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
    return apiFetchJson<T>(path, init, token);
  }

  async function uploadImage(file: File) {
    if (!state.token) {
      throw new Error("请先登录");
    }
    return uploadImageFile(file, state.token);
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

  async function loadAssessmentQuestions() {
    setLoading(true);
    setMessage("");
    try {
      const data = await apiFetch<{ questions: AssessmentQuestion[] }>("/assessment/questions");
      setState((current) => ({
        ...current,
        assessmentQuestions: data.questions
      }));
      setAssessmentAnswers((current) => {
        const next = { ...current };
        for (const question of data.questions) {
          if (next[question.id] === undefined) {
            next[question.id] = 0;
          }
        }
        return next;
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "加载测评题目失败");
    } finally {
      setLoading(false);
    }
  }

  async function loadAssessmentSubmissions(token = state.token) {
    if (!token) {
      return;
    }
    const data = await apiFetch<{ submissions: AssessmentSubmission[] }>("/assessment/submissions", {}, token);
    setState((current) => ({
      ...current,
      assessmentSubmissions: data.submissions,
      latestAssessment: data.submissions[0] ?? current.latestAssessment
    }));
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

  async function loadAppointments(token = state.token) {
    if (!token) {
      return;
    }
    const data = await apiFetchJson<{ appointments?: Appointment[] }>("/appointments", {}, token, "加载预约失败");
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
      await loadAssessmentSubmissions(data.token);
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

  async function submitAssessment() {
    if (!state.token) {
      setMessage("请先登录");
      return;
    }
    if (state.assessmentQuestions.length === 0) {
      setMessage("暂无测评题目");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const answers = state.assessmentQuestions.map((question) => ({
        question_id: question.id,
        score: assessmentAnswers[question.id] ?? 0
      }));
      const data = await apiFetch<{ submission: AssessmentSubmission }>("/assessment/submissions", {
        method: "POST",
        body: JSON.stringify({ answers })
      });
      setState((current) => ({
        ...current,
        latestAssessment: data.submission,
        assessmentSubmissions: [data.submission, ...current.assessmentSubmissions]
      }));
      setMessage("测评已提交");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "提交测评失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <AppHeader currentUserName={state.user?.display_name ?? null} />

      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[360px_1fr]">
        <PlatformSidebar
          loading={loading}
          canManageCounselors={canManageCounselors}
          canEditArticles={canEditArticles}
          counselors={state.counselors}
          categories={state.categories}
          username={username}
          setUsername={setUsername}
          password={password}
          setPassword={setPassword}
          selectedCounselor={selectedCounselor}
          setSelectedCounselor={setSelectedCounselor}
          scheduledAt={scheduledAt}
          setScheduledAt={setScheduledAt}
          appointmentContent={content}
          setAppointmentContent={setContent}
          counselorName={counselorName}
          setCounselorName={setCounselorName}
          counselorGender={counselorGender}
          setCounselorGender={setCounselorGender}
          counselorSpecialty={counselorSpecialty}
          setCounselorSpecialty={setCounselorSpecialty}
          counselorAvailableTime={counselorAvailableTime}
          setCounselorAvailableTime={setCounselorAvailableTime}
          counselorPhone={counselorPhone}
          setCounselorPhone={setCounselorPhone}
          counselorBio={counselorBio}
          setCounselorBio={setCounselorBio}
          counselorAvatarURL={counselorAvatarURL}
          setCounselorAvatarURL={setCounselorAvatarURL}
          categoryName={articleActions.categoryName}
          setCategoryName={articleActions.setCategoryName}
          editingCategoryId={articleActions.editingCategoryId}
          setEditingCategoryId={articleActions.setEditingCategoryId}
          articleCategory={articleActions.articleCategory}
          setArticleCategory={articleActions.setArticleCategory}
          editingArticleId={articleActions.editingArticleId}
          setEditingArticleId={articleActions.setEditingArticleId}
          articleTitle={articleActions.articleTitle}
          setArticleTitle={articleActions.setArticleTitle}
          articleSummary={articleActions.articleSummary}
          setArticleSummary={articleActions.setArticleSummary}
          articleContent={articleActions.articleContent}
          setArticleContent={articleActions.setArticleContent}
          articleCoverURL={articleActions.articleCoverURL}
          setArticleCoverURL={articleActions.setArticleCoverURL}
          onLogin={login}
          onCreateAppointment={createAppointment}
          onSaveCounselorProfile={saveCounselorProfile}
          onUploadCounselorAvatar={uploadCounselorAvatar}
          onSaveCategory={articleActions.saveCategory}
          onDisableCategory={articleActions.disableCategory}
          onSaveArticle={articleActions.saveArticle}
          onArchiveArticle={articleActions.archiveArticle}
          onUploadArticleCover={articleActions.uploadArticleCover}
        />

        <div className="space-y-4">
          <DashboardSummary
            loading={loading}
            message={message}
            stats={stats}
            onRefresh={() => {
              void loadCounselors();
              void articleActions.loadCategories();
              void articleActions.loadArticles();
              void loadForumPosts();
              void loadAssessmentQuestions();
            }}
          />

          <MainContentPanels
            state={state}
            loading={loading}
            canManageAppointments={canManageAppointments}
            forumTitle={forumTitle}
            setForumTitle={setForumTitle}
            forumContent={forumContent}
            setForumContent={setForumContent}
            forumComment={forumComment}
            setForumComment={setForumComment}
            assessmentAnswers={assessmentAnswers}
            setAssessmentAnswers={setAssessmentAnswers}
            onSelectCounselor={setSelectedCounselor}
            onUpdateAppointmentStatus={updateAppointmentStatus}
            onLoadArticle={articleActions.loadArticle}
            onCreateForumPost={createForumPost}
            onLoadForumPost={loadForumPost}
            onArchiveForumPost={archiveForumPost}
            onArchiveForumComment={archiveForumComment}
            onCreateForumComment={createForumComment}
            onSubmitAssessment={submitAssessment}
          />
        </div>
      </section>
    </main>
  );
}
