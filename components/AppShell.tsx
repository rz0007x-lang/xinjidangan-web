"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bot,
  BrainCircuit,
  CreditCard,
  Home,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  ShieldCheck,
  UsersRound
} from "lucide-react";
import { clsx } from "clsx";
import { useAppState } from "@/lib/store";
import { Button } from "./ui";

const navItems = [
  { href: "/home", label: "用户主页", icon: Home },
  { href: "/prompt-debug", label: "提示词调试", icon: MessageSquareText },
  { href: "/memory", label: "记忆查看", icon: BrainCircuit },
  { href: "/community", label: "社区模板", icon: UsersRound },
  { href: "/recharge", label: "充值", icon: CreditCard },
  { href: "/admin/templates", label: "管理员审核", icon: ShieldCheck }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAppState();

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="hidden border-r border-line/80 bg-linen/82 px-4 py-5 backdrop-blur lg:block">
        <Link href="/home" className="mb-8 flex items-center gap-3 rounded-lg px-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink text-white">
            <Bot className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-base font-semibold text-ink">心迹陪伴</span>
            <span className="text-xs text-ink/52">MindTrace Companion</span>
          </span>
        </Link>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  active ? "bg-sage text-white" : "text-ink/68 hover:bg-white hover:text-ink"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 border-b border-line/80 bg-linen/88 px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <Link href="/home" className="flex items-center gap-2 lg:hidden">
              <LayoutDashboard className="h-5 w-5 text-sage" />
              <span className="font-semibold text-ink">心迹陪伴</span>
            </Link>
            <div className="hidden text-sm text-ink/58 lg:block">MindTrace Companion MVP</div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-ink">{user.nickname}</p>
                <p className="text-xs text-ink/50">{user.membership} · ¥{user.balance.toFixed(2)}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-clay text-sm font-semibold text-white">
                {user.avatar}
              </div>
              <Button
                variant="ghost"
                className="h-9 w-9 px-0"
                title="退出登录"
                onClick={() => {
                  logout();
                  router.push("/");
                }}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition",
                    active ? "bg-sage text-white" : "bg-white text-ink/68"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
