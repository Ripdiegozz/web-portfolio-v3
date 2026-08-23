export interface ExperienceItem {
  company: string;
  role: string;
  period: string;
  current?: boolean;
  location?: string;
  highlights: string[];
  skills?: string[];
  kpis?: { value: string; label: string }[];
}
export interface ProjectItem {
  name: string;
  description: string;
  stack: string[];
  repoUrl?: string;
  liveUrl?: string;
}
export interface SkillGroup {
  category: string;
  items: string[];
}
export interface SocialLink {
  label: string;
  href: string;
}

export const experience: ExperienceItem[] = [
  {
    company: 'Wazuh',
    role: 'Full-Stack Engineer',
    period: 'Current',
    current: true,
    location: 'Remote',
    highlights: [
      'Building the Wazuh AI Assistant: backend tooling that lets security analysts query platform data using natural language.',
      'Developing full-stack features, OpenSearch integrations, and releases for the Wazuh web dashboard.',
      'Automating CI/CD pipelines with GitHub Actions to test and build Linux packages for 90,000+ deployments.',
    ],
    skills: ['TypeScript', 'React', 'Node.js', 'Elasticsearch', 'OpenSearch', 'OpenAI', 'Docker', 'Linux'],
    kpis: [
      { value: '90k+ users', label: 'Platform deployments' },
      { value: 'AI Assistant', label: 'GenAI Tooling' },
      { value: 'XDR / SIEM', label: 'Security Dashboard' },
    ],
  },
  {
    company: 'Tres Pi Medios / Stanley Black & Decker',
    role: 'Full-stack Developer',
    period: 'Jul 2024 – Jan 2026',
    location: 'Remote',
    highlights: [
      'Built an internal tool loan and repair app for Stanley Black & Decker Italy, cutting task completion time by 50%.',
      'Developed an Azure Function integrating generative AI to automate Zendesk customer support replies in the US and Canada.',
      'Built real-time data feeds for Power BI operational dashboards and set up i18n support for Italian and English.',
    ],
    skills: ['TypeScript', 'Node.js', 'React', 'Azure', 'OpenAI', 'Docker', 'Git'],
    kpis: [
      { value: '-50% time', label: 'Tool repair app (Italy)' },
      { value: 'Zendesk AI', label: 'Support bot (US/CA)' },
      { value: 'Power BI', label: 'Real-time telemetry' },
    ],
  },
  {
    company: 'SuperGIROS',
    role: 'Full-stack Developer Intern',
    period: 'Aug 2023 – Jul 2024',
    location: 'On-site / Hybrid',
    highlights: [
      'Built internal back-office tools serving 1,100+ financial service points in Norte de Santander.',
      'Built a Node.js sales chatbot that reduced helpdesk support calls by 60%.',
      'Improved web app load speed by 40% through code refactoring, Angular upgrades, and Java/Spring Boot microservices connected to Oracle databases.',
    ],
    skills: ['Node.js', 'TypeScript', 'Angular', 'Java', 'Spring Boot', 'PostgreSQL', 'Oracle SQL', 'Docker'],
    kpis: [
      { value: '1,100+ points', label: 'Financial back-office' },
      { value: '-60% calls', label: 'Internal helpdesk' },
      { value: '+40% speed', label: 'Web performance' },
    ],
  },
];
export const projects: ProjectItem[] = [
  {
    name: 'NatGPT',
    description:
      'AI chat platform with voice recording, transcription, and real-time response streaming.',
    stack: ['React', 'Next.js', 'Tailwind CSS', 'TypeScript', 'Convex', 'OpenAI', 'Clerk'],
    repoUrl: 'https://github.com/Ripdiegozz/nat-gpt',
    liveUrl: 'https://nat-gpt.vercel.app/',
  },
  {
    name: 'Notewave',
    description:
      'Note-taking web app with rich-text markdown editing and task management.',
    stack: ['React', 'Next.js', 'Tailwind CSS', 'TypeScript', 'JavaScript', 'HTML', 'CSS'],
    repoUrl: 'https://github.com/Ripdiegozz/Notewave',
    liveUrl: 'https://notewave-lake.vercel.app/',
  },
];
export interface CoreSkill {
  name: string;
  role: string;
}

export interface SkillCategoryGroup {
  id: string;
  title: string;
  iconName: 'Layers' | 'Cpu' | 'Shield' | 'Terminal';
  description: string;
  skills: string[];
}

export const coreSkills: CoreSkill[] = [
  { name: 'TypeScript', role: 'Primary Language' },
  { name: 'React', role: 'Frontend Architecture' },
  { name: 'Next.js', role: 'Production Framework' },
  { name: 'Node.js', role: 'Backend Runtime' },
  { name: 'PostgreSQL', role: 'Relational Database' },
  { name: 'Elasticsearch', role: 'Distributed Search & SIEM' },
  { name: 'OpenAI', role: 'AI Agent Tooling' },
  { name: 'Tailwind CSS', role: 'Design Systems' },
  { name: 'Docker', role: 'Containerization' },
  { name: 'Git', role: 'Version Control' },
];

export const skillCategories: SkillCategoryGroup[] = [
  {
    id: 'frontend',
    title: 'Frontend & UI Systems',
    iconName: 'Layers',
    description: 'Component architecture, state management, and accessible UI design.',
    skills: ['React', 'Next.js', 'TypeScript', 'Angular', 'Tailwind CSS', 'Astro', 'Redux', 'Vite', 'HTML5', 'CSS3', 'Sass'],
  },
  {
    id: 'backend',
    title: 'Backend & Data Architecture',
    iconName: 'Cpu',
    description: 'REST microservices, database design, distributed search, and LLM integrations.',
    skills: ['Node.js', 'Express', 'PostgreSQL', 'MongoDB', 'Elasticsearch', 'OpenSearch', 'MySQL', 'Oracle SQL', 'OpenAI', 'Java', 'Spring Boot', 'Bash'],
  },
  {
    id: 'devops',
    title: 'Cloud, CI/CD & Testing',
    iconName: 'Shield',
    description: 'CI/CD pipelines, containerized environments, cloud hosting, and automated testing.',
    skills: ['Docker', 'Linux', 'GitHub Actions', 'AWS', 'Azure', 'Vitest', 'Jest', 'Playwright', 'Turborepo', 'NPM', 'Yarn'],
  },
];

export const skills: SkillGroup[] = [
  { category: 'Languages', items: ['TypeScript', 'JavaScript', 'Java', 'HTML', 'CSS', 'Bash'] },
  { category: 'Frameworks & Libraries', items: ['React.js', 'Next.js', 'Angular', 'Node.js', 'Express.js', 'Spring Boot', 'Redux'] },
  { category: 'Bases de Datos', items: ['PostgreSQL', 'MongoDB', 'MySQL', 'Elasticsearch', 'Oracle SQL'] },
  { category: 'Cloud & DevOps', items: ['Docker', 'Linux', 'GitHub Actions', 'AWS', 'Azure', 'Git', 'Vite', 'Turborepo'] },
  { category: 'Testing', items: ['Jest', 'Vitest', 'Playwright'] },
];

export const socials: SocialLink[] = [
  { label: 'GitHub', href: 'https://github.com/Ripdiegozz' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/dagadev' },
  { label: 'CV', href: '/cv.pdf' },
];
export const aboutTextLead =
  'Full-stack engineer building production web applications, LLM tooling, and distributed systems.';
export const aboutTextSupport =
  'Currently at Wazuh building the Wazuh AI Assistant for 90,000+ security users. Before that, built business tools for Stanley Black & Decker (Italy and US) and financial software serving 1,100+ SuperGIROS service points in Colombia. My focus is practical: reliable backends, clean databases, and fast, accessible interfaces.';

