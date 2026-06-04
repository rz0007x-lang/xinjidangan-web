"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="zh-CN">
      <body className="flex min-h-screen items-center justify-center bg-linen px-6">
        <div className="w-full max-w-md rounded-[24px] border border-line bg-white/90 p-8 text-center shadow-soft">
          <p className="text-sm uppercase tracking-[0.22em] text-ink/42">Union Soul</p>
          <h1 className="font-editorial mt-4 text-[32px] text-ink">页面暂时出了点问题</h1>
          <p className="mt-3 text-sm leading-7 text-ink/60">刷新失败时可以先点击下面按钮重新载入，我们已经保留了最基础的错误恢复入口。</p>
          <Button className="mt-6 w-full" onClick={reset}>
            重新加载
          </Button>
        </div>
      </body>
    </html>
  );
}
