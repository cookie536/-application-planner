import type { ReactNode } from "react";

export const pageClass = "flex flex-1 flex-col bg-[#f5f5f7] text-zinc-950";
export const shellClass =
  "mx-auto w-full max-w-3xl px-5 py-8 sm:px-8 sm:py-12";
export const shellWideClass =
  "mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 sm:py-12";
export const titleClass =
  "text-[28px] font-semibold tracking-tight text-zinc-950 sm:text-[32px]";
export const leadClass = "mt-1.5 text-[15px] leading-relaxed text-zinc-500";
export const cardClass =
  "rounded-2xl bg-white px-5 py-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:px-6";
export const cardTitleClass =
  "text-[17px] font-semibold tracking-tight text-zinc-950";
export const labelClass = "text-[13px] font-medium text-zinc-500";
export const fieldClass =
  "mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-[15px] text-zinc-950 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400";
export const areaClass =
  "mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-[15px] leading-relaxed text-zinc-950 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 resize-none";
export const primaryButtonClass =
  "inline-flex h-10 items-center justify-center rounded-full bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300";
export const secondaryButtonClass =
  "inline-flex h-10 items-center justify-center rounded-full bg-white px-4 text-sm font-medium text-zinc-800 ring-1 ring-zinc-200 transition-colors hover:bg-zinc-50";
export const quietButtonClass =
  "text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-950";
export const dangerButtonClass =
  "text-sm font-medium text-red-600 transition-colors hover:text-red-700";
export const backLinkClass =
  "text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-950";
export const chipClass =
  "inline-flex h-8 items-center rounded-full bg-zinc-100 px-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200";
export const chipSelectedClass =
  "inline-flex h-8 items-center rounded-full bg-zinc-900 px-3 text-sm font-medium text-white";
export const overlayClass =
  "fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-8 backdrop-blur-sm sm:px-6";
export const dialogClass =
  "flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-[0_16px_48px_rgba(0,0,0,0.16)]";
export const dialogBodyClass = "overflow-y-auto px-6 py-7 sm:px-8";
export const dialogFooterClass = "flex gap-3 px-6 py-4 sm:px-8";

export function statusPillClass(status: string) {
  if (status === "录取" || status === "已完成") {
    return "bg-emerald-50 text-emerald-800";
  }
  if (status === "拒绝") return "bg-red-50 text-red-700";
  if (status === "已提交" || status === "面试") {
    return "bg-sky-50 text-sky-800";
  }
  if (status === "等待中") return "bg-amber-50 text-amber-800";
  return "bg-zinc-100 text-zinc-700";
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <section className={`${cardClass} px-6 py-14 text-center sm:px-10`}>
      <h2 className="text-xl font-semibold tracking-tight text-zinc-950">
        {title}
      </h2>
      {description ? (
        <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-zinc-500">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </section>
  );
}
