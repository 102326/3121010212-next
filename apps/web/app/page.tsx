import Link from "next/link";
import { Activity, BookOpenText, ClipboardCheck, LayoutDashboard, MessageSquareText, UserRoundCheck } from "lucide-react";

const modules = [
  {
    href: "/dashboard",
    title: "综合工作台",
    description: "查看当前预约、文章、社区和测评的整体状态。",
    icon: LayoutDashboard
  },
  {
    href: "/counselors",
    title: "咨询预约",
    description: "浏览咨询师资料，提交预约并处理预约状态。",
    icon: UserRoundCheck
  },
  {
    href: "/articles",
    title: "健康知识",
    description: "维护心理健康文章、分类和封面内容。",
    icon: BookOpenText
  },
  {
    href: "/forum",
    title: "交流社区",
    description: "发布帖子、查看讨论并参与评论。",
    icon: MessageSquareText
  },
  {
    href: "/assessment",
    title: "心理测评",
    description: "完成自评问卷，查看分数和建议。",
    icon: ClipboardCheck
  }
] as const;

export default function Home() {
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
          <Link className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted" href="/dashboard">
            进入工作台
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-primary">模块导航</p>
          <h2 className="mt-2 text-3xl font-semibold">把核心功能拆成清晰入口</h2>
          <p className="mt-3 leading-7 text-muted-foreground">
            当前版本已经包含预约、文章、社区和测评模块。这里先建立正式页面结构，后续可以继续把共享工作台拆成更细的独立页面。
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((item) => (
            <Link key={item.href} className="rounded-lg border border-border bg-white p-5 shadow-sm transition-colors hover:bg-muted" href={item.href}>
              <item.icon className="mb-5 size-6 text-primary" />
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
