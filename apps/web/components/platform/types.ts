import type { LucideIcon } from "lucide-react";

export type User = {
  id: string;
  username: string;
  role: string;
  display_name: string;
  phone?: string;
};

export type Counselor = {
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

export type Appointment = {
  id: string;
  student_name: string;
  counselor_name: string;
  scheduled_at: string;
  content: string;
  status: string;
  created_at: string;
};

export type Article = {
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

export type ArticleCategory = {
  id: string;
  name: string;
  is_active: boolean;
};

export type ForumComment = {
  id: string;
  post_id: string;
  author_id?: string;
  author?: string;
  content: string;
  created_at: string;
};

export type ForumPost = {
  id: string;
  author_id?: string;
  author?: string;
  title: string;
  content?: string;
  comment_count: number;
  created_at: string;
  comments?: ForumComment[];
};

export type AssessmentQuestion = {
  id: string;
  title: string;
  dimension: string;
  sort_order: number;
};

export type AssessmentSubmission = {
  id: string;
  answers: { question_id: string; score: number }[];
  total_score: number;
  level: string;
  suggestion: string;
  created_at: string;
};

export type ApiState = {
  token: string;
  user: User | null;
  counselors: Counselor[];
  appointments: Appointment[];
  articles: Article[];
  categories: ArticleCategory[];
  forumPosts: ForumPost[];
  assessmentQuestions: AssessmentQuestion[];
  assessmentSubmissions: AssessmentSubmission[];
  latestAssessment: AssessmentSubmission | null;
  selectedForumPost: ForumPost | null;
  selectedArticle: Article | null;
};

export type DashboardMetric = {
  name: string;
  value: string;
  icon: LucideIcon;
};

export const statusText: Record<string, string> = {
  pending: "待确认",
  approved: "已确认",
  cancelled: "已取消",
  completed: "已完成"
};
