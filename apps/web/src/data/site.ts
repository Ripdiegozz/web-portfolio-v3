import { en } from '../i18n/locales/en';
import type {
  CoreSkill,
  ExperienceItem,
  ProjectItem,
  SkillCategoryGroup,
  SocialLink,
} from '../i18n/types';

export type { CoreSkill, ExperienceItem, ProjectItem, SkillCategoryGroup, SocialLink };

export interface SkillGroup {
  category: string;
  items: string[];
}

export const experience: ExperienceItem[] = en.experience.items;
export const projects: ProjectItem[] = en.projects.items;
export const coreSkills: CoreSkill[] = en.skills.coreSkills;
export const skillCategories: SkillCategoryGroup[] = en.skills.categories;
export const socials: SocialLink[] = en.footer.socials;
export const aboutTextLead = en.about.lead;
export const aboutTextSupport = en.about.support;

export const skills: SkillGroup[] = [
  { category: 'Languages', items: ['TypeScript', 'JavaScript', 'Java', 'HTML', 'CSS', 'Bash'] },
  { category: 'Frameworks & Libraries', items: ['React.js', 'Next.js', 'Angular', 'Node.js', 'Express.js', 'Spring Boot', 'Redux'] },
  { category: 'Bases de Datos', items: ['PostgreSQL', 'MongoDB', 'MySQL', 'Elasticsearch', 'Oracle SQL'] },
  { category: 'Cloud & DevOps', items: ['Docker', 'Linux', 'GitHub Actions', 'AWS', 'Azure', 'Git', 'Vite', 'Turborepo'] },
  { category: 'Testing', items: ['Jest', 'Vitest', 'Playwright'] },
];
