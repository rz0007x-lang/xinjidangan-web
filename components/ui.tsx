import { clsx } from "clsx";
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx("rounded-lg border border-line bg-white/86 shadow-soft backdrop-blur", className)}
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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-sage">{eyebrow}</p> : null}
        <h1 className="text-2xl font-semibold text-ink sm:text-3xl">{title}</h1>
        {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/62">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
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
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-ink text-white hover:bg-ink/90",
        variant === "secondary" && "border border-line bg-white text-ink hover:bg-mist",
        variant === "ghost" && "text-ink/70 hover:bg-ink/5 hover:text-ink",
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
        tone === "info" && "bg-blue-100 text-blue-700"
      )}
    >
      {children}
    </span>
  );
}

export const inputClass =
  "min-h-10 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:border-sage focus:ring-2 focus:ring-sage/15";

export const textareaClass =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm leading-6 text-ink outline-none transition placeholder:text-ink/35 focus:border-sage focus:ring-2 focus:ring-sage/15";
