import Link from "next/link";
import { EmptyState, leadClass, pageClass, primaryButtonClass, shellClass, titleClass } from "@/app/ui";

export default function SchedulePage() {
  return (
    <div className={pageClass}>
      <div className={shellClass}>
        <header>
          <h1 className={titleClass}>日程</h1>
          <p className={leadClass}>安排写作时间和提交日期。</p>
        </header>
        <div className="mt-8">
          <EmptyState
            title="暂无日程"
            description="截止日期和节点都在时间轴上，先去那里查看。"
            action={
              <Link href="/timeline" className={primaryButtonClass}>
                查看时间轴
              </Link>
            }
          />
        </div>
      </div>
    </div>
  );
}