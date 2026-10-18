import type { Application, MaterialStatus } from "@/app/applications-context";

/** Illustrative data, stored and edited through the normal applications provider. */
export function createSampleApplications(now = new Date()): Application[] {
  const samples = [
    { school: "香港大学", program: "MSc in Computer Science", country: "中国香港", status: "草稿", days: 7, materials: ["已完成", "草稿", "草稿"] },
    { school: "南洋理工大学", program: "MSc in Information Systems", country: "新加坡", status: "等待中", days: 21, materials: ["已提交", "已提交", "已提交"] },
    { school: "爱丁堡大学", program: "MSc in Design Informatics", country: "英国", status: "面试", days: 45, materials: ["已完成", "草稿", "已提交"] },
  ];

  return samples.map((sample, index) => {
    const id = `demo-application-${index + 1}`;
    // Relative dates keep a first visit useful; persisted dates never shift on refresh.
    const deadline = new Date(now);
    deadline.setDate(deadline.getDate() + sample.days);
    deadline.setHours(23, 59, 0, 0);
    return {
      id,
      isDemo: true,
      school: sample.school,
      program: sample.program,
      country: sample.country,
      status: sample.status,
      deadline: deadline.toISOString(),
      checklist: ["成绩单", "个人陈述", "推荐信"].map((label, materialIndex) => {
        const status = sample.materials[materialIndex] as MaterialStatus;
        return {
          id: `${id}-material-${materialIndex + 1}`,
          label,
          status,
          done: status !== "草稿",
          source: "project",
          versions: [],
          notes: [],
        };
      }),
      notes: [{ id: `${id}-note`, text: "示例申请：学校、项目、截止日期和材料要求仅用于演示，请以学校官网为准。", createdAt: now.toISOString() }],
      website: "",
      tuition: "",
      duration: "",
      languageRequirement: "",
    };
  });
}
