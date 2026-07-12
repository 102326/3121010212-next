import type { Dispatch, SetStateAction } from "react";
import { CheckCircle2, ClipboardCheck, LibraryBig, MessageSquareText, Send, Trash2 } from "lucide-react";

import { statusText } from "@/components/platform/types";
import type { ApiState } from "@/components/platform/types";
import { Button } from "@/components/ui/button";

type MainContentPanelsProps = {
  state: ApiState;
  loading: boolean;
  canManageAppointments: boolean;
  forumTitle: string;
  setForumTitle: Dispatch<SetStateAction<string>>;
  forumContent: string;
  setForumContent: Dispatch<SetStateAction<string>>;
  forumComment: string;
  setForumComment: Dispatch<SetStateAction<string>>;
  assessmentAnswers: Record<string, number>;
  setAssessmentAnswers: Dispatch<SetStateAction<Record<string, number>>>;
  onSelectCounselor: (id: string) => void;
  onUpdateAppointmentStatus: (id: string, status: string) => void;
  onLoadArticle: (id: string) => void;
  onCreateForumPost: () => void;
  onLoadForumPost: (id: string) => void;
  onArchiveForumPost: (id: string) => void;
  onArchiveForumComment: (id: string) => void;
  onCreateForumComment: () => void;
  onSubmitAssessment: () => void;
};

export function MainContentPanels({
  state,
  loading,
  canManageAppointments,
  forumTitle,
  setForumTitle,
  forumContent,
  setForumContent,
  forumComment,
  setForumComment,
  assessmentAnswers,
  setAssessmentAnswers,
  onSelectCounselor,
  onUpdateAppointmentStatus,
  onLoadArticle,
  onCreateForumPost,
  onLoadForumPost,
  onArchiveForumPost,
  onArchiveForumComment,
  onCreateForumComment,
  onSubmitAssessment
}: MainContentPanelsProps) {
  return (
    <section className="grid gap-4 xl:grid-cols-3">
      <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-semibold">咨询师</h2>
        <div className="space-y-3">
          {state.counselors.map((item) => (
            <button
              key={item.id}
              className="w-full rounded-md border border-border p-4 text-left transition-colors hover:bg-muted"
              onClick={() => onSelectCounselor(item.id)}
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
                      onClick={() => onUpdateAppointmentStatus(item.id, "approved")}
                    >
                      确认
                    </Button>
                    <Button
                      variant={item.status === "completed" ? "default" : "outline"}
                      disabled={loading || item.status === "completed"}
                      onClick={() => onUpdateAppointmentStatus(item.id, "completed")}
                    >
                      完成
                    </Button>
                    <Button
                      variant={item.status === "cancelled" ? "default" : "outline"}
                      disabled={loading || item.status === "cancelled"}
                      onClick={() => onUpdateAppointmentStatus(item.id, "cancelled")}
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
                onClick={() => onLoadArticle(item.id)}
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
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">交流社区</h2>
          <MessageSquareText className="size-4 text-primary" />
        </div>
        <div className="space-y-3">
          {state.token ? (
            <div className="rounded-md border border-border p-3">
              <label className="block text-sm">
                <span className="mb-1 block text-muted-foreground">标题</span>
                <input
                  className="h-10 w-full rounded-md border border-border px-3 outline-none focus:ring-2 focus:ring-primary"
                  value={forumTitle}
                  onChange={(event) => setForumTitle(event.target.value)}
                />
              </label>
              <label className="mt-3 block text-sm">
                <span className="mb-1 block text-muted-foreground">内容</span>
                <textarea
                  className="min-h-20 w-full rounded-md border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                  value={forumContent}
                  onChange={(event) => setForumContent(event.target.value)}
                />
              </label>
              <Button className="mt-3 w-full gap-2" disabled={loading || !forumTitle.trim() || !forumContent.trim()} onClick={onCreateForumPost}>
                <Send className="size-4" />
                发布帖子
              </Button>
            </div>
          ) : null}
          {state.forumPosts.length === 0 ? (
            <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">暂无社区帖子</p>
          ) : (
            state.forumPosts.map((item) => (
              <div key={item.id} className="rounded-md border border-border p-4">
                <button className="w-full text-left" onClick={() => onLoadForumPost(item.id)}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{item.author || "匿名用户"}</p>
                    </div>
                    <span className="rounded-md bg-muted px-2 py-1 text-sm text-primary">{item.comment_count}</span>
                  </div>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{item.content}</p>
                </button>
                {state.user && (state.user.role === "admin" || state.user.id === item.author_id) ? (
                  <Button className="mt-3 w-full gap-2" variant="outline" disabled={loading} onClick={() => onArchiveForumPost(item.id)}>
                    <Trash2 className="size-4" />
                    删除帖子
                  </Button>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-semibold">帖子详情</h2>
        {state.selectedForumPost ? (
          <div>
            <div className="mb-3 flex flex-wrap gap-2 text-sm text-muted-foreground">
              <span>{state.selectedForumPost.author || "匿名用户"}</span>
              <span>{new Date(state.selectedForumPost.created_at).toLocaleString()}</span>
              <span>{state.selectedForumPost.comment_count} 条评论</span>
            </div>
            <h3 className="text-lg font-semibold">{state.selectedForumPost.title}</h3>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7">{state.selectedForumPost.content}</p>
            <div className="mt-5 space-y-3">
              <h4 className="font-medium">评论</h4>
              {(state.selectedForumPost.comments ?? []).length === 0 ? (
                <p className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">暂无评论</p>
              ) : (
                (state.selectedForumPost.comments ?? []).map((item) => (
                  <div key={item.id} className="rounded-md border border-border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{item.author || "匿名用户"}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString()}</p>
                      </div>
                      {state.user && (state.user.role === "admin" || state.user.id === item.author_id) ? (
                        <Button className="size-8 p-0" variant="ghost" disabled={loading} onClick={() => onArchiveForumComment(item.id)}>
                          <Trash2 className="size-4" />
                        </Button>
                      ) : null}
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{item.content}</p>
                  </div>
                ))
              )}
              {state.token ? (
                <div className="rounded-md border border-border p-3">
                  <textarea
                    className="min-h-20 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                    value={forumComment}
                    onChange={(event) => setForumComment(event.target.value)}
                  />
                  <Button className="mt-3 w-full gap-2" disabled={loading || !forumComment.trim()} onClick={onCreateForumComment}>
                    <Send className="size-4" />
                    发表评论
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">选择一个帖子查看详情</p>
        )}
      </div>

      <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">心理测评</h2>
          <ClipboardCheck className="size-4 text-primary" />
        </div>
        <div className="space-y-3">
          {state.assessmentQuestions.length === 0 ? (
            <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">暂无测评题目</p>
          ) : (
            state.assessmentQuestions.map((item) => (
              <div key={item.id} className="rounded-md border border-border p-3">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.dimension}</p>
                  </div>
                  <span className="rounded-md bg-muted px-2 py-1 text-sm text-primary">{assessmentAnswers[item.id] ?? 0}</span>
                </div>
                <select
                  className="h-10 w-full rounded-md border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                  value={assessmentAnswers[item.id] ?? 0}
                  onChange={(event) =>
                    setAssessmentAnswers((current) => ({
                      ...current,
                      [item.id]: Number(event.target.value)
                    }))
                  }
                >
                  <option value={0}>0 - 几乎没有</option>
                  <option value={1}>1 - 偶尔</option>
                  <option value={2}>2 - 有时</option>
                  <option value={3}>3 - 经常</option>
                  <option value={4}>4 - 几乎总是</option>
                </select>
              </div>
            ))
          )}
          <Button className="w-full gap-2" disabled={loading || !state.token || state.assessmentQuestions.length === 0} onClick={onSubmitAssessment}>
            <Send className="size-4" />
            提交测评
          </Button>
          {state.latestAssessment ? (
            <div className="rounded-md border border-border bg-muted p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">最近结果</p>
                <span className="rounded-md bg-white px-2 py-1 text-sm text-primary">{state.latestAssessment.level}</span>
              </div>
              <p className="mt-2 text-2xl font-semibold">{state.latestAssessment.total_score}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{state.latestAssessment.suggestion}</p>
            </div>
          ) : null}
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
  );
}
