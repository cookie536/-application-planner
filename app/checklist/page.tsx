"use client";

import Link from "next/link";
import { useApplications } from "@/app/applications-context";
import { ApplicationMaterials } from "@/app/applications/[applicationId]/application-materials";
import { EmptyState, leadClass, pageClass, primaryButtonClass, shellClass, titleClass } from "@/app/ui";

export default function ChecklistPage() {
  const { applications, hasHydrated, toggleChecklistItem } = useApplications();
  if (!hasHydrated) return <div className={pageClass} />;

  return (
    <div className={pageClass}>
      <div className={shellClass}>
        <header>
          <h1 className={titleClass}>材料</h1>
          <p className={leadClass}>跟进每份申请所需的材料和任务。</p>
        </header>
        <div className="mt-8">
          {applications.length > 0 ? (
            <div className="space-y-5">
              {applications.map((application) => (
                <article key={application.id} className="rounded-2xl bg-white p-6">
                  <Link href={`/applications/${application.id}`} className="mb-5 block font-semibold text-zinc-900">
                    {application.school} · {application.program}{application.isDemo ? " · 示例" : ""}
                  </Link>
                  <ApplicationMaterials application={application} onToggle={(materialId) => toggleChecklistItem(application.id, materialId)} />
                </article>
              ))}
            </div>
          ) : (
          <EmptyState
            title="暂无材料"
            description="打开一份申请，在材料一栏添加成绩单、语言成绩或护照。"
            action={
              <Link href="/dashboard" className={primaryButtonClass}>
                前往主页
              </Link>
            }
          />
          )}
        </div>
      </div>
    </div>
  );
}
