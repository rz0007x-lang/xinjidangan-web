"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, Mail, X } from "lucide-react";
import { useAppState } from "@/lib/store";
import { Button, Card, inputClass } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAppState();
  const [account, setAccount] = useState("linche@example.com");
  const [password, setPassword] = useState("companion-demo");
  const [authMode, setAuthMode] = useState<"register" | "reset" | null>(null);
  const [registerAccount, setRegisterAccount] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [resetAccount, setResetAccount] = useState("");
  const [notice, setNotice] = useState("");

  function handleSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    login(account);
    router.push("/home");
  }

  function closeAuthModal() {
    setAuthMode(null);
    setNotice("");
  }

  function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextAccount = registerAccount.trim();
    const nextPassword = registerPassword.trim();
    if (!nextAccount || !nextPassword) return;

    setAccount(nextAccount);
    setPassword(nextPassword);
    setNotice("账号已创建，请直接登录进入工作台。");
    setRegisterAccount("");
    setRegisterPassword("");
    setAuthMode(null);
  }

  function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextAccount = resetAccount.trim();
    if (!nextAccount) return;

    setAccount(nextAccount);
    setPassword("companion-demo");
    setNotice("已发送重置说明，并为演示环境填入默认密码 companion-demo。");
    setResetAccount("");
    setAuthMode(null);
  }

  return (
    <>
      <main className="flex min-h-screen items-center justify-center px-6 py-10">
        <div className="grid w-full max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center">
          <section className="flex min-h-[520px] flex-col justify-center">
            <div className="mx-auto flex w-full max-w-4xl flex-col items-center text-center lg:mx-0 lg:items-start lg:text-left">
              <h1 className="font-editorial text-[50px] font-semibold leading-none text-ink sm:text-[68px]">
                心迹档案
              </h1>
              <div className="mt-5 max-w-3xl">
                <p className="text-[20px] text-ink/72 sm:text-[24px]">Union Soul</p>
                <div className="mt-10 space-y-4">
                  <h2 className="font-editorial text-[30px] font-semibold leading-[1.34] text-ink sm:text-[42px]">
                    <span className="block">欢迎来到硅基世界</span>
                    <span className="block">这是一款只属于你的硅基生命</span>
                  </h2>
                </div>
              </div>
            </div>
          </section>

          <Card className="border-white/60 bg-white/68 p-6 shadow-[0_18px_45px_rgba(112,92,100,0.08)] sm:p-8">
            <div className="mb-6">
              <h2 className="font-editorial text-[30px] text-ink">登录</h2>
              <p className="mt-2 text-sm text-ink/56">使用手机号或邮箱进入用户主页。</p>
            </div>
            <form id="login-form" className="space-y-4" onSubmit={handleSubmit}>
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
                登录
              </Button>
            </form>
            {notice ? <p className="mt-4 rounded-[16px] bg-mist px-4 py-3 text-sm text-sage">{notice}</p> : null}
            <div className="mt-5 flex items-center justify-between text-sm">
              <button
                className="text-sage hover:text-sage/80"
                type="button"
                onClick={() => {
                  setNotice("");
                  setAuthMode("register");
                }}
              >
                注册账号
              </button>
              <button
                className="text-ink/54 hover:text-ink"
                type="button"
                onClick={() => {
                  setNotice("");
                  setAuthMode("reset");
                }}
              >
                忘记密码
              </button>
            </div>
          </Card>
        </div>
      </main>

      {authMode ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(91,75,90,0.24)] px-4 py-6 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-ink/42">Account</p>
                <h2 className="font-editorial mt-2 text-[28px] text-ink">
                  {authMode === "register" ? "注册账号" : "重置密码"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-ink/58">
                  {authMode === "register"
                    ? "创建账号后会自动回填到登录框，方便继续进入工作台。"
                    : "输入手机号或邮箱后，会生成演示环境可直接使用的默认密码。"}
                </p>
              </div>
              <button
                type="button"
                aria-label="关闭弹窗"
                className="rounded-full bg-white/72 p-2 text-ink/54 transition hover:bg-white hover:text-ink"
                onClick={closeAuthModal}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {authMode === "register" ? (
              <form className="mt-6 space-y-4" onSubmit={handleRegister}>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-ink/72">手机号 / 邮箱</span>
                  <input
                    className={inputClass}
                    value={registerAccount}
                    onChange={(event) => setRegisterAccount(event.target.value)}
                    placeholder="输入你的手机号或邮箱"
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-ink/72">设置密码</span>
                  <input
                    className={inputClass}
                    type="password"
                    value={registerPassword}
                    onChange={(event) => setRegisterPassword(event.target.value)}
                    placeholder="至少输入一个演示密码"
                    required
                  />
                </label>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <Button variant="secondary" type="button" onClick={closeAuthModal}>
                    取消
                  </Button>
                  <Button type="submit">创建并回填</Button>
                </div>
              </form>
            ) : (
              <form className="mt-6 space-y-4" onSubmit={handleResetPassword}>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-ink/72">手机号 / 邮箱</span>
                  <input
                    className={inputClass}
                    value={resetAccount}
                    onChange={(event) => setResetAccount(event.target.value)}
                    placeholder="输入需要重置的账号"
                    required
                  />
                </label>
                <div className="rounded-[18px] bg-mist px-4 py-3 text-sm leading-6 text-ink/62">
                  演示环境会把密码重置为 <span className="font-medium text-ink">companion-demo</span>，并自动回填到登录框。
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <Button variant="secondary" type="button" onClick={closeAuthModal}>
                    取消
                  </Button>
                  <Button type="submit">发送重置说明</Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      ) : null}
    </>
  );
}
