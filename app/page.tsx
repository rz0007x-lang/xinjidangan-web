"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, LockKeyhole, Mail, ShieldCheck, X } from "lucide-react";
import { useAppState } from "@/lib/store";
import { Button, Card, inputClass } from "@/components/ui";

type AuthMode = "register" | "reset" | null;
type ValidationResult = { ok: true } | { ok: false; message: string };

const phonePattern = /^1[3-9]\d{9}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeAccount(account: string) {
  return account.trim().toLowerCase();
}

function isPhoneAccount(account: string) {
  return phonePattern.test(account.trim());
}

function isEmailAccount(account: string) {
  return emailPattern.test(account.trim());
}

function validateAccount(account: string): ValidationResult {
  const normalized = account.trim();

  if (!normalized) {
    return { ok: false, message: "请输入手机号或邮箱。" };
  }

  if (!isPhoneAccount(normalized) && !isEmailAccount(normalized)) {
    return { ok: false, message: "账号格式不正确，请输入 11 位手机号或有效邮箱。" };
  }

  return { ok: true };
}

function validatePassword(password: string): ValidationResult {
  const normalized = password.trim();

  if (!normalized) {
    return { ok: false, message: "请输入密码。" };
  }

  if (normalized.length < 6) {
    return { ok: false, message: "密码至少需要 6 位，演示环境也保持这个规则。" };
  }

  return { ok: true };
}

function createDemoCode(account: string) {
  const raw = account.replace(/\D/g, "").slice(-4) || String(Date.now()).slice(-4);
  return raw.padStart(4, "0").slice(-4) + "26";
}

export default function LoginPage() {
  const router = useRouter();
  const { login, registerDemoAccount, resetDemoPassword, demoAccounts } = useAppState();
  const [account, setAccount] = useState("linche@example.com");
  const [password, setPassword] = useState("companion-demo");
  const [loginCode, setLoginCode] = useState("");
  const [authMode, setAuthMode] = useState<AuthMode>(null);
  const [registerAccount, setRegisterAccount] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [registerCode, setRegisterCode] = useState("");
  const [resetAccount, setResetAccount] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [resetError, setResetError] = useState("");
  const [sentCodes, setSentCodes] = useState<Record<string, string>>({});

  const knownAccounts = useMemo(() => demoAccounts.map((item) => item.account), [demoAccounts]);

  function closeAuthModal() {
    setAuthMode(null);
    setNotice("");
    setRegisterError("");
    setResetError("");
  }

  function sendCode(accountValue: string, sceneLabel: string) {
    const accountValidation = validateAccount(accountValue);

    if (!accountValidation.ok) {
      return accountValidation.message;
    }

    const code = createDemoCode(accountValue);
    const accountKey = normalizeAccount(accountValue);
    setSentCodes((current) => ({ ...current, [accountKey]: code }));
    setNotice(`${sceneLabel}验证码已发送：${code}。演示环境会直接展示验证码，便于完整走通流程。`);
    setError("");
    setRegisterError("");
    setResetError("");
    return "";
  }

  function validateCode(accountValue: string, codeValue: string): ValidationResult {
    const accountKey = normalizeAccount(accountValue);
    const expectedCode = sentCodes[accountKey];

    if (!expectedCode) {
      return { ok: false, message: "请先获取验证码。" };
    }

    if (codeValue.trim() !== expectedCode) {
      return { ok: false, message: "验证码错误，请检查后重试。" };
    }

    return { ok: true };
  }

  function handleSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setNotice("");
    setError("");

    const accountValidation = validateAccount(account);
    if (!accountValidation.ok) {
      setError(accountValidation.message);
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.ok) {
      setError(passwordValidation.message);
      return;
    }

    const codeValidation = validateCode(account, loginCode);
    if (!codeValidation.ok) {
      setError(codeValidation.message);
      return;
    }

    const result = login(account, password);

    if (!result.ok) {
      setError(
        result.reason === "account_not_found"
          ? "账号不存在，请先注册，或确认是否输错了手机号 / 邮箱。"
          : result.reason === "account_disabled"
            ? "该账号已被停用，请联系平台客服处理。"
            : "登录失败，密码不正确。你可以重新输入，或使用“忘记密码”回填新密码。"
      );
      return;
    }

    setNotice("验证通过，正在进入个人中心。");
    router.push("/home");
  }

  function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setRegisterError("");

    const accountValidation = validateAccount(registerAccount);
    if (!accountValidation.ok) {
      setRegisterError(accountValidation.message);
      return;
    }

    const passwordValidation = validatePassword(registerPassword);
    if (!passwordValidation.ok) {
      setRegisterError(passwordValidation.message);
      return;
    }

    if (registerPassword.trim() !== registerConfirmPassword.trim()) {
      setRegisterError("两次输入的密码不一致，请重新确认。");
      return;
    }

    const codeValidation = validateCode(registerAccount, registerCode);
    if (!codeValidation.ok) {
      setRegisterError(codeValidation.message);
      return;
    }

    const result = registerDemoAccount(registerAccount, registerPassword);

    if (!result.ok) {
      setRegisterError("这个账号已经存在了，可以直接登录，或通过找回流程重置密码。");
      return;
    }

    setAccount(registerAccount.trim());
    setPassword(registerPassword.trim());
    setLoginCode(sentCodes[normalizeAccount(registerAccount)] ?? "");
    setNotice("账号已创建，并已把账号、密码和验证码回填到登录框。你现在可以直接登录。");
    setRegisterAccount("");
    setRegisterPassword("");
    setRegisterConfirmPassword("");
    setRegisterCode("");
    setAuthMode(null);
  }

  function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setResetError("");

    const accountValidation = validateAccount(resetAccount);
    if (!accountValidation.ok) {
      setResetError(accountValidation.message);
      return;
    }

    const codeValidation = validateCode(resetAccount, resetCode);
    if (!codeValidation.ok) {
      setResetError(codeValidation.message);
      return;
    }

    const passwordValidation = validatePassword(resetPassword);
    if (!passwordValidation.ok) {
      setResetError(passwordValidation.message);
      return;
    }

    if (resetPassword.trim() !== resetConfirmPassword.trim()) {
      setResetError("两次输入的新密码不一致，请重新确认。");
      return;
    }

    const result = resetDemoPassword(resetAccount, resetPassword);

    if (!result.ok) {
      setResetError("没有找到这个账号。你可以先注册，或者确认是否输错了手机号 / 邮箱。");
      return;
    }

    setAccount(resetAccount.trim());
    setPassword(resetPassword.trim());
    setLoginCode(sentCodes[normalizeAccount(resetAccount)] ?? "");
    setNotice("新密码已设置完成，并已自动回填到登录框，方便你继续完成登录。");
    setResetAccount("");
    setResetPassword("");
    setResetConfirmPassword("");
    setResetCode("");
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
                <div className="mt-8 rounded-[26px] border border-white/70 bg-white/58 p-5 text-left shadow-[0_18px_45px_rgba(112,92,100,0.06)] backdrop-blur">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-sage" />
                    <p className="text-sm font-medium text-ink/72">演示账号说明</p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-ink/60">
                    登录流程现在包含账号格式校验、验证码校验和失败分支。注册与找回仍是演示模式，但会在成功后自动回填登录表单。
                  </p>
                  <p className="mt-3 text-xs leading-6 text-ink/48">
                    当前可用示例账号：{knownAccounts.join(" / ")}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <Card className="border-white/60 bg-white/68 p-6 shadow-[0_18px_45px_rgba(112,92,100,0.08)] sm:p-8">
            <div className="mb-6">
              <h2 className="font-editorial text-[30px] text-ink">登录</h2>
              <p className="mt-2 text-sm text-ink/56">使用手机号或邮箱进入个人中心。</p>
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
                  placeholder="name@example.com / 13800138000"
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
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px]">
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm font-medium text-ink/72">
                    <ShieldCheck className="h-4 w-4 text-sage" />
                    验证码
                  </span>
                  <input
                    className={inputClass}
                    inputMode="numeric"
                    value={loginCode}
                    onChange={(event) => setLoginCode(event.target.value)}
                    placeholder="输入 6 位验证码"
                    required
                  />
                </label>
                <Button
                  className="mt-[30px] w-full"
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    const message = sendCode(account, "登录");
                    if (message) setError(message);
                  }}
                >
                  获取验证码
                </Button>
              </div>
              {error ? (
                <div className="rounded-[18px] border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>{error}</p>
                  </div>
                </div>
              ) : null}
              <Button className="w-full" type="submit">
                登录
              </Button>
            </form>
            {notice ? (
              <p className="mt-4 rounded-[16px] bg-mist px-4 py-3 text-sm leading-6 text-sage">{notice}</p>
            ) : null}
            <div className="mt-5 flex items-center justify-between text-sm">
              <button
                className="text-sage hover:text-sage/80"
                type="button"
                onClick={() => {
                  setNotice("");
                  setError("");
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
                  setError("");
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
                  {authMode === "register" ? "注册账号" : "找回密码"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-ink/58">
                  {authMode === "register"
                    ? "注册成功后会自动回填登录表单，并保留验证码，方便继续完成登录。"
                    : "找回成功后会把新密码和验证码一起回填到登录框，继续走完登录验证。"}
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
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px]">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-ink/72">验证码</span>
                    <input
                      className={inputClass}
                      inputMode="numeric"
                      value={registerCode}
                      onChange={(event) => setRegisterCode(event.target.value)}
                      placeholder="输入验证码"
                      required
                    />
                  </label>
                  <Button
                    className="mt-[30px] w-full"
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      const message = sendCode(registerAccount, "注册");
                      if (message) setRegisterError(message);
                    }}
                  >
                    获取验证码
                  </Button>
                </div>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-ink/72">设置密码</span>
                  <input
                    className={inputClass}
                    type="password"
                    value={registerPassword}
                    onChange={(event) => setRegisterPassword(event.target.value)}
                    placeholder="至少 6 位"
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-ink/72">确认密码</span>
                  <input
                    className={inputClass}
                    type="password"
                    value={registerConfirmPassword}
                    onChange={(event) => setRegisterConfirmPassword(event.target.value)}
                    placeholder="再次输入密码"
                    required
                  />
                </label>
                {registerError ? (
                  <div className="rounded-[18px] border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <p>{registerError}</p>
                    </div>
                  </div>
                ) : null}
                <div className="rounded-[18px] bg-mist px-4 py-3 text-sm leading-6 text-ink/62">
                  演示账号会保存在本地浏览器状态里，注册完成后可直接用于后续登录。
                </div>
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
                    placeholder="输入需要找回的账号"
                    required
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px]">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-ink/72">验证码</span>
                    <input
                      className={inputClass}
                      inputMode="numeric"
                      value={resetCode}
                      onChange={(event) => setResetCode(event.target.value)}
                      placeholder="输入验证码"
                      required
                    />
                  </label>
                  <Button
                    className="mt-[30px] w-full"
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      const message = sendCode(resetAccount, "找回");
                      if (message) setResetError(message);
                    }}
                  >
                    获取验证码
                  </Button>
                </div>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-ink/72">新密码</span>
                  <input
                    className={inputClass}
                    type="password"
                    value={resetPassword}
                    onChange={(event) => setResetPassword(event.target.value)}
                    placeholder="输入新的登录密码"
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-ink/72">确认新密码</span>
                  <input
                    className={inputClass}
                    type="password"
                    value={resetConfirmPassword}
                    onChange={(event) => setResetConfirmPassword(event.target.value)}
                    placeholder="再次输入新密码"
                    required
                  />
                </label>
                {resetError ? (
                  <div className="rounded-[18px] border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <p>{resetError}</p>
                    </div>
                  </div>
                ) : null}
                <div className="rounded-[18px] bg-mist px-4 py-3 text-sm leading-6 text-ink/62">
                  演示环境不会真的发短信或邮件，但会完整保留“发送验证码 → 校验 → 设置新密码 → 回填登录框”的流程。
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <Button variant="secondary" type="button" onClick={closeAuthModal}>
                    取消
                  </Button>
                  <Button type="submit">重置并回填</Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      ) : null}
    </>
  );
}
