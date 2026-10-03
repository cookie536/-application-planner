import type { Application } from "@/app/applications-context";

const labelClassName =
  "text-xs font-medium uppercase tracking-wide text-zinc-400";

function displayValue(value: string) {
  return value.trim() || "未填写";
}

function websiteHref(website: string) {
  const trimmed = website.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function ProgramInformation({
  application,
}: {
  application: Application;
}) {
  const website = application.website.trim();
  const href = websiteHref(website);

  return (
    <section aria-labelledby="program-info-title">
      <h2
        id="program-info-title"
        className="text-xl font-semibold tracking-tight text-zinc-900"
      >
        项目信息
      </h2>
      <dl className="mt-5 grid gap-5">
        <div>
          <dt className={labelClassName}>官方网站</dt>
          <dd className="mt-1.5 text-[15px] text-zinc-900">
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
              >
                {website}
              </a>
            ) : (
              "未填写"
            )}
          </dd>
        </div>
        <div>
          <dt className={labelClassName}>学费</dt>
          <dd className="mt-1.5 text-[15px] text-zinc-900">
            {displayValue(application.tuition)}
          </dd>
        </div>
        <div>
          <dt className={labelClassName}>学制</dt>
          <dd className="mt-1.5 text-[15px] text-zinc-900">
            {displayValue(application.duration)}
          </dd>
        </div>
        <div>
          <dt className={labelClassName}>语言要求</dt>
          <dd className="mt-1.5 text-[15px] text-zinc-900">
            {displayValue(application.languageRequirement)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
