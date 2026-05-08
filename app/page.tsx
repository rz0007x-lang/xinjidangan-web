"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, LockKeyhole, Mail, Sparkles } from "lucide-react";
import { useAppState } from "@/lib/store";
import { Button, Card, inputClass } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAppState();
  const [account, setAccount] = useState("linche@example.com");
  const [password, setPassword] = useState("companion-demo");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    login(account);
    router.push("/home");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1fr_420px] lg:items-stretch">
        <section className="flex min-h-[420px] flex-col justify-between rounded-lg border border-line bg-linen/78 p-6 shadow-soft sm:p-8">
          <div>
            <div className="mb-8 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-ink text-white">
                <Bot className="h-5 w-5" />
              </span>
              <div>
                <h1 className="text-2xl font-semibold text-ink">心迹陪伴</h1>
                <p className="text-sm text-ink/56">长期陪伴型 AI 平台</p>
              </div>
            </div>
            <div className="max-w-xl">
              <p className="mb-3 inline-flex items-center gap-2 rounded-lg bg-sage/10 px-3 py-2 text-sm font-medium text-sage">
                <Sparkles className="h-4 w-4" />
                MVP 可运行原型
              </p>
              <h2 className="text-3xl font-semibold leading-tight text-ink sm:text-4xl">
                管理记忆体、提示词、充值与智能体模板审核。
              </h2>
              <p className="mt-4 text-sm leading-6 text-ink/62">
                登录后直接进入产品工作台。当前版本使用本地 mock 数据，所有页面均可跳转并保留关键交互状态。
              </p>
            </div>
          </div>
          <div className="mt-8 grid gap-3 text-sm text-ink/62 sm:grid-cols-3">
            <div className="rounded-lg bg-white/74 p-4">账号级充值与社区模板</div>
            <div className="rounded-lg bg-white/74 p-4">记忆体级提示词调试</div>
            <div className="rounded-lg bg-white/74 p-4">只读记忆图谱查看</div>
          </div>
        </section>

        <Card className="p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-ink">登录</h2>
            <p className="mt-2 text-sm text-ink/56">使用手机号或邮箱进入用户主页。</p>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium text-ink/72">
                <Mail className="h-4 w-4 text-sage" />
                手机号 / 邮箱
              </span>
              <input
                className={inputClass}
                value={account}
                onChange={(event) => setAccount(event.target.value)}
                placeholder="name@example.com"
                required
              />
            </label>
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium text-ink/72">
                <LockKeyhole className="h-4 w-4 text-sage" />
                密码
              </span>
              <input
                className={inputClass}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="请输入密码"
                required
              />
            </label>
            <Button className="w-full" type="submit">
              登录并进入主页
            </Button>
          </form>
          <div className="mt-5 flex items-center justify-between text-sm">
            <button className="text-sage hover:text-sage/80" type="button">
              注册账号
            </button>
            <button className="text-ink/54 hover:text-ink" type="button">
              忘记密码
            </button>
          </div>
        </Card>
      </div>
    </main>
  );
}
