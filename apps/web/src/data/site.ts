export interface ExperienceItem {
  company: string;
  role: string;
  period: string;
  highlights: string[];
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
    highlights: ['Building the Wazuh AI Assistant'],
  },
];
export const projects: ProjectItem[] = [
  { name: 'NatGPT', description: 'Placeholder — migrated from v2.', stack: [] },
  { name: 'Notewave', description: 'Placeholder — migrated from v2.', stack: [] },
];
export const skills: SkillGroup[] = [];
export const socials: SocialLink[] = [
  { label: 'GitHub', href: 'https://github.com/Ripdiegozz' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/dagadev' },
];
export const aboutText =
  'Full-Stack Engineer at Wazuh building the Wazuh AI Assistant.';
