import Link from "next/link";
import { EmptyState, leadClass, pageClass, primaryButtonClass, shellClass, titleClass } from "@/app/ui";

export default function ChecklistPage() {
  return (
    <div className={pageClass}>
      <div className={shellClass}>
        <header>
          <h1 className={titleClass}>材料</h1>
          <p className={leadClass}>跟进每份申请所需的材料和任务。</p>
        </header>
        <div className="mt-8">
          <EmptyState
            title="暂无材料"
            description="打开一份申请，在材料一栏添加成绩单、语言成绩或护照。"
            action={
              <Link href="/dashboard" className={primaryButtonClass}>
                前往主页
              </Link>
            }
          />
        </div>
      </div>
    </div>
  );
}
