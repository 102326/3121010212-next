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
import { useAppointmentActions } from "@/components/platform/use-appointment-actions";
import { useAssessmentActions } from "@/components/platform/use-assessment-actions";
import { useArticleActions } from "@/components/platform/use-article-actions";
import { useCounselorActions } from "@/components/platform/use-counselor-actions";
import { useForumActions } from "@/components/platform/use-forum-actions";
import type {
  ApiState,
  DashboardMetric,
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
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const canEditArticles = state.user?.role === "admin" || state.user?.role === "counselor";
  const canManageAppointments = state.user?.role === "admin" || state.user?.role === "counselor";
  const canManageCounselors = state.user?.role === "admin" || state.user?.role === "counselor";

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

  const counselorActions = useCounselorActions({
    state,
    setState,
    canManageCounselors,
    setLoading,
    setMessage,
    apiFetch,
    uploadImage
  });

  const articleActions = useArticleActions({
    state,
    setState,
    canEditArticles,
    setLoading,
    setMessage,
    apiFetch,
    uploadImage
  });

  const forumActions = useForumActions({
    state,
    setState,
    setLoading,
    setMessage,
    apiFetch
  });

  const assessmentActions = useAssessmentActions({
    state,
    setState,
    setLoading,
    setMessage,
    apiFetch
  });

  const appointmentActions = useAppointmentActions({
    state,
    setState,
    canManageAppointments,
    selectedCounselor: counselorActions.selectedCounselor,
    setLoading,
    setMessage,
    apiFetch
  });

  useEffect(() => {
    void counselorActions.loadCounselors();
    void articleActions.loadCategories();
    void articleActions.loadArticles();
    void forumActions.loadForumPosts();
    void assessmentActions.loadAssessmentQuestions();
  }, []);

  async function apiFetch<T>(path: string, init: RequestInit = {}, token = state.token): Promise<T> {
    return apiFetchJson<T>(path, init, token);
  }

  async function uploadImage(file: File) {
    if (!state.token) {
      throw new Error("请先登录");
    }
    return uploadImageFile(file, state.token);
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
      await appointmentActions.loadAppointments(data.token);
      await assessmentActions.loadAssessmentSubmissions(data.token);
      setMessage(`已登录：${data.user.display_name}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "登录失败");
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
          selectedCounselor={counselorActions.selectedCounselor}
          setSelectedCounselor={counselorActions.setSelectedCounselor}
          scheduledAt={appointmentActions.scheduledAt}
          setScheduledAt={appointmentActions.setScheduledAt}
          appointmentContent={appointmentActions.content}
          setAppointmentContent={appointmentActions.setContent}
          counselorName={counselorActions.counselorName}
          setCounselorName={counselorActions.setCounselorName}
          counselorGender={counselorActions.counselorGender}
          setCounselorGender={counselorActions.setCounselorGender}
          counselorSpecialty={counselorActions.counselorSpecialty}
          setCounselorSpecialty={counselorActions.setCounselorSpecialty}
          counselorAvailableTime={counselorActions.counselorAvailableTime}
          setCounselorAvailableTime={counselorActions.setCounselorAvailableTime}
          counselorPhone={counselorActions.counselorPhone}
          setCounselorPhone={counselorActions.setCounselorPhone}
          counselorBio={counselorActions.counselorBio}
          setCounselorBio={counselorActions.setCounselorBio}
          counselorAvatarURL={counselorActions.counselorAvatarURL}
          setCounselorAvatarURL={counselorActions.setCounselorAvatarURL}
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
          onCreateAppointment={appointmentActions.createAppointment}
          onSaveCounselorProfile={counselorActions.saveCounselorProfile}
          onUploadCounselorAvatar={counselorActions.uploadCounselorAvatar}
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
              void counselorActions.loadCounselors();
              void articleActions.loadCategories();
              void articleActions.loadArticles();
              void forumActions.loadForumPosts();
              void assessmentActions.loadAssessmentQuestions();
            }}
          />

          <MainContentPanels
            state={state}
            loading={loading}
            canManageAppointments={canManageAppointments}
            forumTitle={forumActions.forumTitle}
            setForumTitle={forumActions.setForumTitle}
            forumContent={forumActions.forumContent}
            setForumContent={forumActions.setForumContent}
            forumComment={forumActions.forumComment}
            setForumComment={forumActions.setForumComment}
            assessmentAnswers={assessmentActions.assessmentAnswers}
            setAssessmentAnswers={assessmentActions.setAssessmentAnswers}
            onSelectCounselor={counselorActions.setSelectedCounselor}
            onUpdateAppointmentStatus={appointmentActions.updateAppointmentStatus}
            onLoadArticle={articleActions.loadArticle}
            onCreateForumPost={forumActions.createForumPost}
            onLoadForumPost={forumActions.loadForumPost}
            onArchiveForumPost={forumActions.archiveForumPost}
            onArchiveForumComment={forumActions.archiveForumComment}
            onCreateForumComment={forumActions.createForumComment}
            onSubmitAssessment={assessmentActions.submitAssessment}
          />
        </div>
      </section>
    </main>
  );
}
