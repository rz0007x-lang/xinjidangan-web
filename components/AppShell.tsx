"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  BrainCircuit,
  ChevronDown,
  CreditCard,
  Headset,
  Home,
  Inbox,
  LayoutDashboard,
  LogOut,
  MessageSquareText
} from "lucide-react";
import { clsx } from "clsx";
import { useAppState } from "@/lib/store";

const navItems = [
  { href: "/home", label: "用户主页", icon: Home },
  { href: "/prompt-debug", label: "提示词调试", icon: MessageSquareText },
  { href: "/memory", label: "记忆查看", icon: BrainCircuit },
  { href: "/inbox", label: "收件箱", icon: Inbox },
  { href: "/recharge", label: "充值", icon: CreditCard }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAuthenticated, hasHydratedStorage } = useAppState();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (!hasHydratedStorage) return;

    if (!isAuthenticated) {
      router.replace("/");
    }
  }, [hasHydratedStorage, isAuthenticated, router]);

  if (!hasHydratedStorage) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-linen px-6">
        <div className="rounded-[24px] border border-line bg-white/90 px-8 py-6 text-center shadow-soft">
          <p className="text-sm text-ink/52">正在恢复工作台状态…</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-linen px-6">
        <div className="rounded-[24px] border border-line bg-white/90 px-8 py-6 text-center shadow-soft">
          <p className="text-sm text-ink/52">当前未登录，正在返回登录页…</p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="hidden border-r border-line/70 bg-linen/70 px-5 py-6 backdrop-blur lg:block">
        <Link href="/home" className="mb-8 flex items-center gap-3 rounded-lg px-2">
          <span>
            <span className="font-editorial block text-[22px] font-semibold text-ink">心迹档案</span>
            <span className="text-[11px] uppercase tracking-[0.2em] text-ink/44">Union Soul Workspace</span>
          </span>
        </Link>
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 rounded-[18px] px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-white text-ink shadow-[0_12px_30px_rgba(80,67,53,0.08)]"
                    : "text-ink/60 hover:bg-white/80 hover:text-ink"
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
        <header className="sticky top-0 z-20 border-b border-line/70 bg-linen/82 px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <Link href="/home" className="flex items-center gap-2 lg:hidden">
              <LayoutDashboard className="h-5 w-5 text-sage" />
              <span className="font-semibold text-ink">心迹档案</span>
            </Link>
            <div className="hidden text-[11px] uppercase tracking-[0.22em] text-ink/42 lg:block">Union Soul Workspace</div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-ink">{user.nickname}</p>
              </div>
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full border border-line/80 bg-white/88 px-2 py-1.5 shadow-[0_10px_24px_rgba(223,201,232,0.18)] transition hover:border-sage/40 hover:bg-white"
                  onClick={() => setMenuOpen((current) => !current)}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-[16px] bg-clay text-sm font-semibold text-white">
                    {user.avatar}
                  </div>
                  <ChevronDown className={`h-4 w-4 text-ink/48 transition ${menuOpen ? "rotate-180" : ""}`} />
                </button>

                {menuOpen ? (
                  <div className="absolute right-0 top-[calc(100%+10px)] z-30 w-44 rounded-[20px] border border-line bg-white p-2 shadow-[0_20px_40px_rgba(80,67,53,0.12)]">
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-sm font-medium text-ink/72 transition hover:bg-mist hover:text-ink"
                      onClick={() => {
                        setMenuOpen(false);
                        router.push("/support");
                      }}
                    >
                      <Headset className="h-4 w-4" />
                      联系客服
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-sm font-medium text-ink/72 transition hover:bg-mist hover:text-ink"
                      onClick={() => {
                        setMenuOpen(false);
                        logout();
                        router.push("/");
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      退出登录
                    </button>
                  </div>
                ) : null}
              </div>
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
                    "flex shrink-0 items-center gap-2 rounded-[16px] px-3 py-2 text-xs font-medium transition",
                    active ? "bg-white text-ink shadow-[0_10px_22px_rgba(80,67,53,0.08)]" : "bg-white/82 text-ink/68"
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
