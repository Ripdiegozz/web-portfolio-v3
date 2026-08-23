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
      'Building the Wazuh AI Assistant, agent tooling, and scalable backend microservices.',
      'Architecting intuitive UI workflows and real-time interfaces relied upon daily by security analysts worldwide.',
    ],
    skills: ['TypeScript', 'Python', 'React', 'Docker', 'Linux', 'OpenAI'],
    kpis: [
      { value: 'AI Assistant', label: 'GenAI Agent Tooling' },
      { value: 'Full-Stack', label: 'Analyst UX & Services' },
      { value: 'Global', label: 'Enterprise Security' },
    ],
  },
  {
    company: 'Tres Pi Medios / Stanley Black & Decker',
    role: 'Full-stack Developer',
    period: 'Jul 2024 – Jan 2025',
    location: 'Remote',
    highlights: [
      'Built a tool loan and repair management application for Stanley Black & Decker in Italy, cutting task time by 50%.',
      'Developed an Azure Cloud Function automating generative AI integration, enabling automated response generation for Stanley Black & Decker customers on Zendesk in the U.S.',
      'Developed chatbot features for customer support workflows in the U.S. and Canada, improving response efficiency across multiple markets.',
      'Implemented real-time data delivery for a Power BI dashboard, improving visibility into operational metrics and reporting workflows.',
      'Integrated internationalization across frontend and backend for web applications in Italy and the Middle East, enabling support for both Italian and English.',
    ],
    skills: ['TypeScript', 'Node.js', 'OpenAI', 'Python', 'Docker', 'Git'],
    kpis: [
      { value: '-50%', label: 'Task time in Italy' },
      { value: 'GenAI', label: 'Zendesk US/CA bot' },
      { value: 'Real-time', label: 'Power BI analytics' },
    ],
  },
  {
    company: 'SuperGIROS',
    role: 'Full-stack Developer Intern',
    period: 'Aug 2023 – Jul 2024',
    location: 'On-site / Hybrid',
    highlights: [
      'Developed a Node.js chatbot to assist sales personnel, reducing helpdesk calls by 60%.',
      'Improved the performance of the main web application by 40% through refactoring, optimization, and an Angular upgrade.',
      'Built an inventory and purchasing management application from scratch, reducing task time by 50%.',
      'Created RESTful APIs to integrate new functionalities into the company Intranet and web applications using Java, Spring, and Hibernate with remote OracleSQL databases.',
      'Implemented RESTful APIs in the microservices environment using Docker and Linux servers, supporting scalable service delivery.',
      'Developed a Java desktop service to manage matrix printers, improving the printing workflow with real-time WebSocket updates.',
    ],
    skills: ['Node.js', 'TypeScript', 'Docker', 'Linux', 'PostgreSQL', 'Git'],
    kpis: [
      { value: '-60%', label: 'Helpdesk calls' },
      { value: '+40%', label: 'App performance' },
      { value: '-50%', label: 'Inventory task time' },
    ],
  },
];
export const projects: ProjectItem[] = [
  {
    name: 'NatGPT',
    description:
      'AI-powered chat platform for text and voice conversations, with real-time messaging, voice recording with transcription, and AI-generated responses.',
    stack: ['React', 'Next.js', 'Tailwind CSS', 'TypeScript', 'Convex', 'OpenAI', 'Clerk'],
    repoUrl: 'https://github.com/Ripdiegozz/nat-gpt',
    liveUrl: 'https://nat-gpt.vercel.app/',
  },
  {
    name: 'Notewave',
    description:
      'Note-taking app with rich text editing, task management, and responsive design for capturing and sharing ideas.',
    stack: ['React', 'Next.js', 'Tailwind CSS', 'TypeScript', 'JavaScript', 'HTML', 'CSS'],
    repoUrl: 'https://github.com/Ripdiegozz/Notewave',
    liveUrl: 'https://notewave-lake.vercel.app/',
  },
];
export const skills: SkillGroup[] = [
  { category: 'Languages', items: ['TypeScript', 'JavaScript', 'HTML', 'CSS', 'Bash'] },
  { category: 'Frameworks & Libraries', items: ['React.js', 'Next.js', 'Node.js', 'Express.js', 'Redux'] },
  { category: 'Styling', items: ['Tailwind CSS', 'Sass'] },
  { category: 'Tooling', items: ['Git', 'GitHub', 'NPM', 'Yarn', 'Vite'] },
  { category: 'Infra, CI & Testing', items: ['GitHub Actions', 'Jest', 'Docker', 'Linux', 'Elasticsearch'] },
];
export const socials: SocialLink[] = [
  { label: 'GitHub', href: 'https://github.com/Ripdiegozz' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/dagadev' },
  { label: 'CV', href: '/cv.pdf' },
];
export const aboutTextLead =
  'Full-Stack Engineer at Wazuh building the Wazuh AI Assistant.';
export const aboutTextSupport =
  'Previously at Tres Pi Medios (Stanley Black & Decker) and SuperGIROS, building back-office software used by 1,100+ service points.';
