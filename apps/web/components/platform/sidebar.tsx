import type { Dispatch, SetStateAction } from "react";
import { CalendarCheck, ImagePlus, LibraryBig, LogIn, Pencil, Plus, Send, Trash2, UserRoundCheck } from "lucide-react";

import type { ArticleCategory, Counselor } from "@/components/platform/types";
import { Button } from "@/components/ui/button";

type PlatformSidebarProps = {
  loading: boolean;
  canManageCounselors: boolean;
  canEditArticles: boolean;
  counselors: Counselor[];
  categories: ArticleCategory[];
  username: string;
  setUsername: Dispatch<SetStateAction<string>>;
  password: string;
  setPassword: Dispatch<SetStateAction<string>>;
  selectedCounselor: string;
  setSelectedCounselor: Dispatch<SetStateAction<string>>;
  scheduledAt: string;
  setScheduledAt: Dispatch<SetStateAction<string>>;
  appointmentContent: string;
  setAppointmentContent: Dispatch<SetStateAction<string>>;
  counselorName: string;
  setCounselorName: Dispatch<SetStateAction<string>>;
  counselorGender: string;
  setCounselorGender: Dispatch<SetStateAction<string>>;
  counselorSpecialty: string;
  setCounselorSpecialty: Dispatch<SetStateAction<string>>;
  counselorAvailableTime: string;
  setCounselorAvailableTime: Dispatch<SetStateAction<string>>;
  counselorPhone: string;
  setCounselorPhone: Dispatch<SetStateAction<string>>;
  counselorBio: string;
  setCounselorBio: Dispatch<SetStateAction<string>>;
  counselorAvatarURL: string;
  setCounselorAvatarURL: Dispatch<SetStateAction<string>>;
  categoryName: string;
  setCategoryName: Dispatch<SetStateAction<string>>;
  editingCategoryId: string;
  setEditingCategoryId: Dispatch<SetStateAction<string>>;
  articleCategory: string;
  setArticleCategory: Dispatch<SetStateAction<string>>;
  editingArticleId: string;
  setEditingArticleId: Dispatch<SetStateAction<string>>;
  articleTitle: string;
  setArticleTitle: Dispatch<SetStateAction<string>>;
  articleSummary: string;
  setArticleSummary: Dispatch<SetStateAction<string>>;
  articleContent: string;
  setArticleContent: Dispatch<SetStateAction<string>>;
  articleCoverURL: string;
  setArticleCoverURL: Dispatch<SetStateAction<string>>;
  onLogin: () => void;
  onCreateAppointment: () => void;
  onSaveCounselorProfile: () => void;
  onUploadCounselorAvatar: (file: File | null) => void;
  onSaveCategory: () => void;
  onDisableCategory: (id: string, name: string) => void;
  onSaveArticle: () => void;
  onArchiveArticle: () => void;
  onUploadArticleCover: (file: File | null) => void;
};

export function PlatformSidebar(props: PlatformSidebarProps) {
  return (
    <aside className="space-y-4">
      <AccountPanel
        username={props.username}
        password={props.password}
        loading={props.loading}
        onUsernameChange={props.setUsername}
        onPasswordChange={props.setPassword}
        onLogin={props.onLogin}
      />

      <AppointmentPanel
        counselors={props.counselors}
        selectedCounselor={props.selectedCounselor}
        scheduledAt={props.scheduledAt}
        content={props.appointmentContent}
        loading={props.loading}
        onCounselorChange={props.setSelectedCounselor}
        onScheduledAtChange={props.setScheduledAt}
        onContentChange={props.setAppointmentContent}
        onCreateAppointment={props.onCreateAppointment}
      />

      {props.canManageCounselors ? (
        <CounselorProfilePanel
          counselors={props.counselors}
          selectedCounselor={props.selectedCounselor}
          loading={props.loading}
          counselorName={props.counselorName}
          counselorGender={props.counselorGender}
          counselorSpecialty={props.counselorSpecialty}
          counselorAvailableTime={props.counselorAvailableTime}
          counselorPhone={props.counselorPhone}
          counselorBio={props.counselorBio}
          counselorAvatarURL={props.counselorAvatarURL}
          onCounselorChange={props.setSelectedCounselor}
          onCounselorNameChange={props.setCounselorName}
          onCounselorGenderChange={props.setCounselorGender}
          onCounselorSpecialtyChange={props.setCounselorSpecialty}
          onCounselorAvailableTimeChange={props.setCounselorAvailableTime}
          onCounselorPhoneChange={props.setCounselorPhone}
          onCounselorBioChange={props.setCounselorBio}
          onCounselorAvatarURLChange={props.setCounselorAvatarURL}
          onUploadCounselorAvatar={props.onUploadCounselorAvatar}
          onSaveCounselorProfile={props.onSaveCounselorProfile}
        />
      ) : null}

      {props.canEditArticles ? (
        <CategoryManagerPanel
          categories={props.categories}
          loading={props.loading}
          categoryName={props.categoryName}
          editingCategoryId={props.editingCategoryId}
          onCategoryNameChange={props.setCategoryName}
          onEditingCategoryIdChange={props.setEditingCategoryId}
          onSaveCategory={props.onSaveCategory}
          onDisableCategory={props.onDisableCategory}
        />
      ) : null}

      {props.canEditArticles ? (
        <ArticleEditorPanel
          categories={props.categories}
          loading={props.loading}
          articleCategory={props.articleCategory}
          editingArticleId={props.editingArticleId}
          articleTitle={props.articleTitle}
          articleSummary={props.articleSummary}
          articleContent={props.articleContent}
          articleCoverURL={props.articleCoverURL}
          onArticleCategoryChange={props.setArticleCategory}
          onEditingArticleIdChange={props.setEditingArticleId}
          onArticleTitleChange={props.setArticleTitle}
          onArticleSummaryChange={props.setArticleSummary}
          onArticleContentChange={props.setArticleContent}
          onArticleCoverURLChange={props.setArticleCoverURL}
          onSaveArticle={props.onSaveArticle}
          onArchiveArticle={props.onArchiveArticle}
          onUploadArticleCover={props.onUploadArticleCover}
        />
      ) : null}
    </aside>
  );
}

type AccountPanelProps = {
  username: string;
  password: string;
  loading: boolean;
  onUsernameChange: Dispatch<SetStateAction<string>>;
  onPasswordChange: Dispatch<SetStateAction<string>>;
  onLogin: () => void;
};

function AccountPanel({ username, password, loading, onUsernameChange, onPasswordChange, onLogin }: AccountPanelProps) {
  return (
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
            onChange={(event) => onUsernameChange(event.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted-foreground">密码</span>
          <input
            className="h-10 w-full rounded-md border border-border px-3 outline-none focus:ring-2 focus:ring-primary"
            type="password"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
          />
        </label>
        <Button className="w-full gap-2" disabled={loading} onClick={onLogin}>
          <LogIn className="size-4" />
          登录
        </Button>
      </div>
    </div>
  );
}

type AppointmentPanelProps = {
  counselors: Counselor[];
  selectedCounselor: string;
  scheduledAt: string;
  content: string;
  loading: boolean;
  onCounselorChange: Dispatch<SetStateAction<string>>;
  onScheduledAtChange: Dispatch<SetStateAction<string>>;
  onContentChange: Dispatch<SetStateAction<string>>;
  onCreateAppointment: () => void;
};

function AppointmentPanel({
  counselors,
  selectedCounselor,
  scheduledAt,
  content,
  loading,
  onCounselorChange,
  onScheduledAtChange,
  onContentChange,
  onCreateAppointment
}: AppointmentPanelProps) {
  return (
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
            onChange={(event) => onCounselorChange(event.target.value)}
          >
            {counselors.map((item) => (
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
            onChange={(event) => onScheduledAtChange(event.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted-foreground">内容</span>
          <textarea
            className="min-h-24 w-full rounded-md border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
            value={content}
            onChange={(event) => onContentChange(event.target.value)}
          />
        </label>
        <Button className="w-full gap-2" disabled={loading || !selectedCounselor} onClick={onCreateAppointment}>
          <CalendarCheck className="size-4" />
          提交预约
        </Button>
      </div>
    </div>
  );
}

type CounselorProfilePanelProps = {
  counselors: Counselor[];
  selectedCounselor: string;
  loading: boolean;
  counselorName: string;
  counselorGender: string;
  counselorSpecialty: string;
  counselorAvailableTime: string;
  counselorPhone: string;
  counselorBio: string;
  counselorAvatarURL: string;
  onCounselorChange: Dispatch<SetStateAction<string>>;
  onCounselorNameChange: Dispatch<SetStateAction<string>>;
  onCounselorGenderChange: Dispatch<SetStateAction<string>>;
  onCounselorSpecialtyChange: Dispatch<SetStateAction<string>>;
  onCounselorAvailableTimeChange: Dispatch<SetStateAction<string>>;
  onCounselorPhoneChange: Dispatch<SetStateAction<string>>;
  onCounselorBioChange: Dispatch<SetStateAction<string>>;
  onCounselorAvatarURLChange: Dispatch<SetStateAction<string>>;
  onUploadCounselorAvatar: (file: File | null) => void;
  onSaveCounselorProfile: () => void;
};

function CounselorProfilePanel({
  counselors,
  selectedCounselor,
  loading,
  counselorName,
  counselorGender,
  counselorSpecialty,
  counselorAvailableTime,
  counselorPhone,
  counselorBio,
  counselorAvatarURL,
  onCounselorChange,
  onCounselorNameChange,
  onCounselorGenderChange,
  onCounselorSpecialtyChange,
  onCounselorAvailableTimeChange,
  onCounselorPhoneChange,
  onCounselorBioChange,
  onCounselorAvatarURLChange,
  onUploadCounselorAvatar,
  onSaveCounselorProfile
}: CounselorProfilePanelProps) {
  return (
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
            onChange={(event) => onCounselorChange(event.target.value)}
          >
            {counselors.map((item) => (
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
            onChange={(event) => onCounselorNameChange(event.target.value)}
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">性别</span>
            <input
              className="h-10 w-full rounded-md border border-border px-3 outline-none focus:ring-2 focus:ring-primary"
              value={counselorGender}
              onChange={(event) => onCounselorGenderChange(event.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">电话</span>
            <input
              className="h-10 w-full rounded-md border border-border px-3 outline-none focus:ring-2 focus:ring-primary"
              value={counselorPhone}
              onChange={(event) => onCounselorPhoneChange(event.target.value)}
            />
          </label>
        </div>
        <label className="block text-sm">
          <span className="mb-1 block text-muted-foreground">专长</span>
          <input
            className="h-10 w-full rounded-md border border-border px-3 outline-none focus:ring-2 focus:ring-primary"
            value={counselorSpecialty}
            onChange={(event) => onCounselorSpecialtyChange(event.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted-foreground">可预约时间</span>
          <input
            className="h-10 w-full rounded-md border border-border px-3 outline-none focus:ring-2 focus:ring-primary"
            value={counselorAvailableTime}
            onChange={(event) => onCounselorAvailableTimeChange(event.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted-foreground">头像 URL</span>
          <input
            className="h-10 w-full rounded-md border border-border px-3 outline-none focus:ring-2 focus:ring-primary"
            value={counselorAvatarURL}
            onChange={(event) => onCounselorAvatarURLChange(event.target.value)}
          />
        </label>
        <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-border text-sm transition-colors hover:bg-muted">
          <ImagePlus className="size-4 text-primary" />
          上传头像
          <input
            className="hidden"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(event) => onUploadCounselorAvatar(event.target.files?.[0] ?? null)}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted-foreground">简介</span>
          <textarea
            className="min-h-24 w-full rounded-md border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
            value={counselorBio}
            onChange={(event) => onCounselorBioChange(event.target.value)}
          />
        </label>
        <Button
          className="w-full gap-2"
          disabled={loading || !selectedCounselor || !counselorName.trim() || !counselorSpecialty.trim()}
          onClick={onSaveCounselorProfile}
        >
          <Send className="size-4" />
          保存资料
        </Button>
      </div>
    </div>
  );
}

type CategoryManagerPanelProps = {
  categories: ArticleCategory[];
  loading: boolean;
  categoryName: string;
  editingCategoryId: string;
  onCategoryNameChange: Dispatch<SetStateAction<string>>;
  onEditingCategoryIdChange: Dispatch<SetStateAction<string>>;
  onSaveCategory: () => void;
  onDisableCategory: (id: string, name: string) => void;
};

function CategoryManagerPanel({
  categories,
  loading,
  categoryName,
  editingCategoryId,
  onCategoryNameChange,
  onEditingCategoryIdChange,
  onSaveCategory,
  onDisableCategory
}: CategoryManagerPanelProps) {
  return (
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
            onChange={(event) => onCategoryNameChange(event.target.value)}
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <Button className="gap-2" disabled={loading || !categoryName.trim()} onClick={onSaveCategory}>
            <Plus className="size-4" />
            {editingCategoryId ? "保存分类" : "新增分类"}
          </Button>
          <Button
            variant="ghost"
            disabled={loading}
            onClick={() => {
              onEditingCategoryIdChange("");
              onCategoryNameChange("");
            }}
          >
            清空
          </Button>
        </div>
        <div className="space-y-2">
          {categories.length === 0 ? (
            <p className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">暂无分类</p>
          ) : (
            categories.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
                <button
                  className="min-w-0 flex-1 truncate text-left text-sm"
                  onClick={() => {
                    onEditingCategoryIdChange(item.id);
                    onCategoryNameChange(item.name);
                  }}
                >
                  {item.name}
                </button>
                <Button
                  className="size-8 p-0"
                  variant="ghost"
                  disabled={loading}
                  onClick={() => {
                    onEditingCategoryIdChange(item.id);
                    onCategoryNameChange(item.name);
                  }}
                  aria-label={`编辑分类 ${item.name}`}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  className="size-8 p-0"
                  variant="ghost"
                  disabled={loading}
                  onClick={() => onDisableCategory(item.id, item.name)}
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
  );
}

type ArticleEditorPanelProps = {
  categories: ArticleCategory[];
  loading: boolean;
  articleCategory: string;
  editingArticleId: string;
  articleTitle: string;
  articleSummary: string;
  articleContent: string;
  articleCoverURL: string;
  onArticleCategoryChange: Dispatch<SetStateAction<string>>;
  onEditingArticleIdChange: Dispatch<SetStateAction<string>>;
  onArticleTitleChange: Dispatch<SetStateAction<string>>;
  onArticleSummaryChange: Dispatch<SetStateAction<string>>;
  onArticleContentChange: Dispatch<SetStateAction<string>>;
  onArticleCoverURLChange: Dispatch<SetStateAction<string>>;
  onSaveArticle: () => void;
  onArchiveArticle: () => void;
  onUploadArticleCover: (file: File | null) => void;
};

function ArticleEditorPanel({
  categories,
  loading,
  articleCategory,
  editingArticleId,
  articleTitle,
  articleSummary,
  articleContent,
  articleCoverURL,
  onArticleCategoryChange,
  onEditingArticleIdChange,
  onArticleTitleChange,
  onArticleSummaryChange,
  onArticleContentChange,
  onArticleCoverURLChange,
  onSaveArticle,
  onArchiveArticle,
  onUploadArticleCover
}: ArticleEditorPanelProps) {
  return (
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
            onChange={(event) => onArticleCategoryChange(event.target.value)}
          >
            {categories.length === 0 ? <option value="">暂无分类</option> : null}
            {categories.map((item) => (
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
            onChange={(event) => onArticleTitleChange(event.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted-foreground">摘要</span>
          <textarea
            className="min-h-20 w-full rounded-md border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
            value={articleSummary}
            onChange={(event) => onArticleSummaryChange(event.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted-foreground">正文</span>
          <textarea
            className="min-h-28 w-full rounded-md border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
            value={articleContent}
            onChange={(event) => onArticleContentChange(event.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted-foreground">封面 URL</span>
          <input
            className="h-10 w-full rounded-md border border-border px-3 outline-none focus:ring-2 focus:ring-primary"
            value={articleCoverURL}
            onChange={(event) => onArticleCoverURLChange(event.target.value)}
          />
        </label>
        <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-border text-sm transition-colors hover:bg-muted">
          <ImagePlus className="size-4 text-primary" />
          上传封面
          <input
            className="hidden"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(event) => onUploadArticleCover(event.target.files?.[0] ?? null)}
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <Button className="gap-2" disabled={loading || !articleTitle || !articleContent} onClick={onSaveArticle}>
            <Send className="size-4" />
            保存
          </Button>
          <Button variant="outline" disabled={loading || !editingArticleId} onClick={onArchiveArticle}>
            归档
          </Button>
        </div>
        <Button
          className="w-full"
          variant="ghost"
          onClick={() => {
            onEditingArticleIdChange("");
            onArticleCategoryChange(categories[0]?.name ?? "");
            onArticleTitleChange("");
            onArticleSummaryChange("");
            onArticleContentChange("");
            onArticleCoverURLChange("");
          }}
        >
          新建文章
        </Button>
      </div>
    </div>
  );
}
