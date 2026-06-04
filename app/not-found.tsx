import Link from "next/link";
import { Button } from "@/components/ui";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-linen px-6">
      <div className="w-full max-w-md rounded-[24px] border border-line bg-white/90 p-8 text-center shadow-soft">
        <p className="text-sm uppercase tracking-[0.22em] text-ink/42">Union Soul</p>
        <h1 className="font-editorial mt-4 text-[32px] text-ink">页面不存在</h1>
        <p className="mt-3 text-sm leading-7 text-ink/60">这个地址暂时没有内容，可以返回首页继续浏览。</p>
        <Link href="/" className="mt-6 inline-flex w-full">
          <Button className="w-full">返回首页</Button>
        </Link>
      </div>
    </main>
  );
}
