export type Locale = 'en' | 'es';

export interface MetaTranslations {
  title: string;
  description: string;
  ogLocale: string;
  keywords: string;
}

export interface NavTranslations {
  about: string;
  experience: string;
  skills: string;
  projects: string;
  activity: string;
  blog: string;
  contact: string;
  contactCta: string;
  toggleThemeLabel: string;
  toggleLanguageLabel: string;
  skipToContent: string;
}

export interface HeroTranslations {
  kicker: string;
  headlineStart: string;
  headlineEmphasis: string;
  headlineEnd: string;
  lead: string;
  contactButton: string;
  githubAriaLabel: string;
  linkedinAriaLabel: string;
  cvLabel: string;
  cvAriaLabel: string;
}

export interface MarqueeTranslations {
  kicker: string;
}

export interface AboutTranslations {
  sectionTitle: string;
  lead: string;
  support: string;
  philosophyQuote?: string;
  philosophyLabel?: string;
}

export interface ExperienceTranslations {
  sectionTitle: string;
  activeLabel: string;
  atLabel: string;
  clientLabel: string;
  contributionsHeading: string;
  technologiesHeading: string;
  tablistAriaLabel: string;
  items: ExperienceItem[];
}

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

export interface SkillsTranslations {
  sectionTitle: string;
  sectionDescription: string;
  coreStackTitle: string;
  coreStackSubtitle: string;
  coreSkills: CoreSkill[];
  categories: SkillCategoryGroup[];
}

export interface ProjectItem {
  name: string;
  description: string;
  stack: string[];
  repoUrl?: string;
  liveUrl?: string;
}

export interface ProjectsTranslations {
  sectionTitle: string;
  liveLabel: string;
  sourceLabel: string;
  items: ProjectItem[];
}

export interface ActivityTranslations {
  sectionTitle: string;
  totalContributions: string;
  longestStreak: string;
  currentStreak: string;
  activeDaysInYear: string;
  daysUnit: string;
  less: string;
  more: string;
  syncingTitle: string;
  syncingDescription: string;
  viewOnGithub: string;
  inTheLastYear: string;
  singularContribution: string;
  pluralContributions: string;
  months: readonly string[];
}

export interface ContactTranslations {
  sectionTitle: string;
  sectionDescription: string;
  nameLabel: string;
  namePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  messageLabel: string;
  messagePlaceholder: string;
  sendButton: string;
  sendingButton: string;
  successMessage: string;
  errorMessage: string;
  preferEmail: string;
  emailAddress: string;
}

export interface WritingTranslations {
  sectionTitle: string;
  lead: string;
  viewAll: string;
  readTime: string;
  readArticle: string;
  emptyState: string;
}

export interface BlogPageTranslations {
  title: string;
  description: string;
  backHome: string;
  backBlog: string;
  allArticles: string;
  readTime: string;
  publishedOn: string;
  tagsLabel: string;
  tableOfContents: string;
  emptyState: string;
}

export interface FooterTranslations {
  copyright: string;
  socials: SocialLink[];
}

export interface ExperienceItem {
  company: string;
  companyUrl?: string;
  client?: string;
  clientUrl?: string;
  role: string;
  period: string;
  current?: boolean;
  location?: string;
  highlights: string[];
  skills?: string[];
  kpis?: { value: string; label: string }[];
}

export interface SocialLink {
  label: string;
  href: string;
}

export interface ExperienceDashboardLabels {
  active?: string | undefined;
  at?: string | undefined;
  clientLabel?: string | undefined;
  keyContributions?: string | undefined;
  technologies?: string | undefined;
  tablistAriaLabel?: string | undefined;
}

export interface ContributionGridLabels {
  totalContributions?: string;
  longestStreak?: string;
  currentStreak?: string;
  activeDaysInYear?: string;
  daysUnit?: string;
  less?: string;
  more?: string;
  syncingTitle?: string;
  syncingDescription?: string;
  viewOnGithub?: string;
  inTheLastYear?: string;
  singularContribution?: string;
  pluralContributions?: string;
}

export interface ContactFormLabels {
  nameLabel?: string;
  namePlaceholder?: string;
  emailLabel?: string;
  emailPlaceholder?: string;
  messageLabel?: string;
  messagePlaceholder?: string;
  sendButton?: string;
  sendingButton?: string;
  successMessage?: string;
  errorMessage?: string;
}

export interface ChatAssistantTranslations {
  floatingButtonLabel: string;
  badge: string;
  title: string;
  subtitle: string;
  placeholder: string;
  sendAriaLabel: string;
  clearAriaLabel: string;
  closeAriaLabel: string;
  initialMessage: string;
  suggestedQuestions: string[];
  disclaimer: string;
  errorMessage: string;
  rateLimitMessage: string;
}

export interface TranslationDictionary {
  meta: MetaTranslations;
  nav: NavTranslations;
  hero: HeroTranslations;
  marquee: MarqueeTranslations;
  about: AboutTranslations;
  experience: ExperienceTranslations;
  skills: SkillsTranslations;
  projects: ProjectsTranslations;
  activity: ActivityTranslations;
  writing: WritingTranslations;
  blogPage: BlogPageTranslations;
  contact: ContactTranslations;
  footer: FooterTranslations;
  chatAssistant?: ChatAssistantTranslations;
}
