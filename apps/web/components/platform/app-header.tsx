import { Activity } from "lucide-react";

type AppHeaderProps = {
  currentUserName: string | null;
};

export function AppHeader({ currentUserName }: AppHeaderProps) {
  return (
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
        <div className="flex items-center gap-2 text-sm text-muted-foreground">{currentUserName ?? "未登录"}</div>
      </div>
    </section>
  );
}
