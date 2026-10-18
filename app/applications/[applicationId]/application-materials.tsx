import Link from "next/link";
import {
  isCommonLinkedMaterial,
  type Application,
} from "@/app/applications-context";

export function ApplicationMaterials({
  application,
  onToggle,
}: {
  application: Application;
  onToggle: (materialId: string) => void;
}) {
  return (
    <section aria-labelledby={`materials-title-${application.id}`}>
      <h2
        id={`materials-title-${application.id}`}
        className="text-xl font-semibold tracking-tight text-zinc-900"
      >
        材料
      </h2>
      {application.checklist.length === 0 ? (
        <p className="mt-4 text-[15px] text-zinc-500">还没有材料</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {application.checklist.map((item) => (
            <li key={item.id} className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => onToggle(item.id)}
                className="size-4 rounded border-zinc-300 text-zinc-900 accent-zinc-900"
                aria-label={`将${item.label}标为完成`}
              />
              <Link
                href={`/applications/${application.id}/materials/${item.id}`}
                className={`min-w-0 text-[15px] hover:underline ${
                  item.done ? "text-zinc-500 line-through" : "text-zinc-800"
                }`}
              >
                {item.label}
                <span className="ml-1.5 text-xs font-normal text-zinc-400 no-underline">
                  · {isCommonLinkedMaterial(item) ? "通用材料" : "项目专属"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
