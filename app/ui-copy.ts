export const DEFAULT_STATUSES = [
  "草稿",
  "已提交",
  "等待中",
  "面试",
  "录取",
  "拒绝",
] as const;

const ENGLISH_STATUS: Record<string, string> = {
  Draft: "草稿",
  Submitted: "已提交",
  Waiting: "等待中",
  Interview: "面试",
  Offer: "录取",
  Rejected: "拒绝",
  Ready: "就绪",
};

export function displayStatus(status: string) {
  return ENGLISH_STATUS[status] ?? status;
}

export const DOCUMENT_CATEGORY_LABELS: Record<string, string> = {
  Transcript: "成绩单",
  "Language Test": "语言成绩",
  Identity: "身份证明",
  Certificate: "证书",
  Other: "其他",
};

export function displayCategory(category: string) {
  return DOCUMENT_CATEGORY_LABELS[category] ?? category;
}

export const NAV_TABS = [
  { href: "/dashboard", label: "主页" },
  { href: "/timeline", label: "时间轴" },
  { href: "/documents", label: "文件库" },
  { href: "/schedule", label: "日程" },
] as const;
