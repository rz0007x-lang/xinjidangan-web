import { clsx } from "clsx";
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx("rounded-[20px] border border-line bg-white/90 shadow-soft backdrop-blur sm:rounded-[24px]", className)}
      {...props}
    />
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
      <div>
        {eyebrow ? <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-ink/42">{eyebrow}</p> : null}
        <h1 className="font-editorial text-[26px] font-semibold leading-tight text-ink sm:text-[38px]">{title}</h1>
        {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/62">{description}</p> : null}
      </div>
      {action ? <div className="w-full sm:w-auto sm:shrink-0">{action}</div> : null}
    </div>
  );
}

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  return (
    <button
      className={clsx(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-5 py-2 text-center text-sm font-medium leading-5 transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-[#eadbe7] text-ink shadow-[0_10px_24px_rgba(105,92,86,0.09)] hover:bg-[#e4d2e1]",
        variant === "secondary" && "border border-line bg-white text-ink hover:bg-mist",
        variant === "ghost" && "text-ink/70 hover:bg-sage/10 hover:text-ink",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
        className
      )}
      {...props}
    />
  );
}

export function Badge({
  children,
  tone = "neutral"
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium",
        tone === "neutral" && "bg-ink/6 text-ink/64",
        tone === "success" && "bg-sage/12 text-sage",
        tone === "warning" && "bg-amber-100 text-amber-700",
        tone === "danger" && "bg-red-100 text-red-700",
        tone === "info" && "bg-[#f5e8f0] text-[#9f6f89]"
      )}
    >
      {children}
    </span>
  );
}

export const inputClass =
  "min-h-10 w-full rounded-[14px] border border-line bg-white/72 px-3 py-2 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:border-sage focus:ring-2 focus:ring-sage/15";

export const textareaClass =
  "w-full min-w-0 rounded-[14px] border border-line bg-white/72 px-3 py-2 text-sm leading-6 text-ink outline-none transition placeholder:text-ink/35 focus:border-sage focus:ring-2 focus:ring-sage/15";
