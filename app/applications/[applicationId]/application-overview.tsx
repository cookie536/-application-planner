import { displayStatus } from "@/app/ui-copy";
import type { Application } from "@/app/applications-context";

const labelClassName =
  "text-xs font-medium uppercase tracking-wide text-zinc-400";

function formatDeadline(deadline: string) {
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return "未填写";

  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatDaysRemaining(deadline: string) {
  const due = new Date(deadline);
  if (Number.isNaN(due.getTime())) return "未填写";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDay = new Date(due);
  dueDay.setHours(0, 0, 0, 0);
  const days = Math.round((dueDay.getTime() - today.getTime()) / 86_400_000);

  if (days > 0) return `剩余 ${days} 天`;
  if (days === 0) return "今天截止";
  return `已逾期 ${Math.abs(days)} 天`;
}

function displayText(value: string) {
  return value.trim() || "未填写";
}

export function ApplicationOverview({
  application,
}: {
  application: Application;
}) {
  return (
    <section aria-labelledby="overview-title">
      <h2
        id="overview-title"
        className="text-xl font-semibold tracking-tight text-zinc-900"
      >
        项目概览
      </h2>
      <dl className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <dt className={labelClassName}>学校</dt>
          <dd className="mt-1.5 text-[15px] text-zinc-900">
            {displayText(application.school)}
          </dd>
        </div>
        <div>
          <dt className={labelClassName}>项目</dt>
          <dd className="mt-1.5 text-[15px] text-zinc-900">
            {displayText(application.program)}
          </dd>
        </div>
        <div>
          <dt className={labelClassName}>国家或地区</dt>
          <dd className="mt-1.5 text-[15px] text-zinc-900">
            {displayText(application.country)}
          </dd>
        </div>
        <div>
          <dt className={labelClassName}>状态</dt>
          <dd className="mt-1.5 text-[15px] text-zinc-900">
            {displayStatus(application.status) || "未填写"}
          </dd>
        </div>
        <div>
          <dt className={labelClassName}>截止日期</dt>
          <dd className="mt-1.5 text-[15px] text-zinc-900">
            {formatDeadline(application.deadline)}
          </dd>
        </div>
        <div>
          <dt className={labelClassName}>剩余天数</dt>
          <dd className="mt-1.5 text-[15px] font-medium text-zinc-900">
            {formatDaysRemaining(application.deadline)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
