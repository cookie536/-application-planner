export type ProgramRecord = {
  id: string;
  school: string;
  program: string;
  country: string;
  website: string;
  tuition: string;
  duration: string;
  languageRequirement: string;
  deadline: string;
  aliases: string[];
};

export const PROGRAMS: ProgramRecord[] = [
  {
    id: "hku-ma-sociology",
    school: "香港大学",
    program: "MA Sociology",
    country: "中国香港",
    website: "https://sociology.hku.hk/",
    tuition: "",
    duration: "全日制1年，兼读制2年",
    languageRequirement: "英语",
    deadline: "",
    aliases: ["HKU", "港大", "The University of Hong Kong", "社会学", "社会学文学硕士"],
  },
  {
    id: "hku-msocsc",
    school: "香港大学",
    program: "Master of Social Sciences",
    country: "中国香港",
    website: "https://www.socsc.hku.hk/",
    tuition: "",
    duration: "",
    languageRequirement: "英语",
    deadline: "",
    aliases: ["HKU", "港大", "MSocSc", "社会科学硕士"],
  },
  {
    id: "cuhk-ma-sociology",
    school: "香港中文大学",
    program: "MA Sociology",
    country: "中国香港",
    website: "https://www.soc.cuhk.edu.hk/",
    tuition: "",
    duration: "全日制1年",
    languageRequirement: "英语",
    deadline: "",
    aliases: ["CUHK", "中大", "The Chinese University of Hong Kong", "社会学", "社会学文学硕士"],
  },
  {
    id: "cuhk-ma-gender-studies",
    school: "香港中文大学",
    program: "MA Gender Studies",
    country: "中国香港",
    website: "https://www.gender.cuhk.edu.hk/",
    tuition: "",
    duration: "全日制1年，兼读制2年",
    languageRequirement: "英语",
    deadline: "",
    aliases: ["CUHK", "中大", "性别研究", "性别研究文学硕士", "Gender Studies"],
  },
  {
    id: "lse-msc-sociology",
    school: "伦敦政治经济学院",
    program: "MSc Sociology",
    country: "英国",
    website: "https://www.lse.ac.uk/sociology",
    tuition: "",
    duration: "全日制1年",
    languageRequirement: "英语",
    deadline: "",
    aliases: ["LSE", "London School of Economics", "社会学", "社会学理学硕士"],
  },
  {
    id: "oxford-msc-sociology",
    school: "牛津大学",
    program: "MSc Sociology",
    country: "英国",
    website: "https://www.sociology.ox.ac.uk/",
    tuition: "",
    duration: "全日制1年",
    languageRequirement: "英语",
    deadline: "",
    aliases: ["Oxford", "University of Oxford", "社会学", "社会学理学硕士"],
  },
  {
    id: "cambridge-mphil-sociology",
    school: "剑桥大学",
    program: "MPhil in Sociology",
    country: "英国",
    website: "https://www.sociology.cam.ac.uk/",
    tuition: "",
    duration: "全日制1年",
    languageRequirement: "英语",
    deadline: "",
    aliases: ["Cambridge", "University of Cambridge", "社会学", "社会学哲学硕士"],
  },
  {
    id: "ucl-msc-sociology",
    school: "伦敦大学学院",
    program: "MSc Sociology",
    country: "英国",
    website: "https://www.ucl.ac.uk/social-historical-sciences/sociology",
    tuition: "",
    duration: "全日制1年",
    languageRequirement: "英语",
    deadline: "",
    aliases: ["UCL", "University College London", "社会学", "社会学理学硕士"],
  },
];

export function searchPrograms(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return PROGRAMS;

  return PROGRAMS.filter((program) => {
    const haystack = [
      program.school,
      program.program,
      program.country,
      ...program.aliases,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalized);
  });
}
