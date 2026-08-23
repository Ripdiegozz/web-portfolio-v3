import type { SVGProps } from 'react';
import type { SimpleIcon } from 'simple-icons';
import {
  siAnthropic,
  siAstro,
  siCloudflare,
  siCss,
  siDocker,
  siElasticsearch,
  siExpress,
  siFastapi,
  siGit,
  siGithub,
  siGithubactions,
  siGnubash,
  siGo,
  siGraphql,
  siHono,
  siHtml5,
  siHuggingface,
  siJavascript,
  siJest,
  siLinux,
  siNextdotjs,
  siNodedotjs,
  siNpm,
  siPostgresql,
  siPython,
  siReact,
  siRedis,
  siRedux,
  siRust,
  siSass,
  siTailwindcss,
  siTurborepo,
  siTypescript,
  siVite,
  siVitest,
  siX,
  siYarn,
} from 'simple-icons';

export interface BrandIconData {
  title: string;
  slug: string;
  hex: string;
  path: string;
  svg?: string;
  source?: string;
}

export interface BrandIconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
  icon?: SimpleIcon | BrandIconData;
  title?: string;
}

const customLinkedin: BrandIconData = {
  title: 'LinkedIn',
  slug: 'linkedin',
  hex: '0A66C2',
  path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
};

const customOpenai: BrandIconData = {
  title: 'OpenAI',
  slug: 'openai',
  hex: '412991',
  path: 'M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z',
};

const customPlaywright: BrandIconData = {
  title: 'Playwright',
  slug: 'playwright',
  hex: '2EAD33',
  path: 'M20.947 8.305a6.518 6.518 0 0 0-4.04-4.838 7.027 7.027 0 0 0-6.195.736 6.34 6.34 0 0 0-2.822 5.09c-.067 1.583.47 3.125 1.503 4.316a6.837 6.837 0 0 0 4.67 2.378 6.577 6.577 0 0 0 5.253-1.616 6.666 6.666 0 0 0 1.631-6.066zm-5.748 4.793a3.537 3.537 0 0 1-3.69-.58 3.597 3.597 0 0 1-1.077-2.68 3.57 3.57 0 0 1 1.547-2.84 3.73 3.73 0 0 1 3.25-.39 3.493 3.493 0 0 1 2.213 2.62 3.633 3.633 0 0 1-.787 3.27 3.55 3.55 0 0 1-1.456.6zM8.347 16.482a5.454 5.454 0 0 0 4.093 1.838 5.674 5.674 0 0 0 3.39-1.127 8.04 8.04 0 0 1-4.225 1.157 7.747 7.747 0 0 1-5.77-2.583 7.234 7.234 0 0 1-1.745-5.26 7.422 7.422 0 0 1 3.06-5.59 7.79 7.79 0 0 1 5.9-1.255 7.973 7.973 0 0 0-4.63 1.488 6.52 6.52 0 0 0-2.52 4.962 6.444 6.444 0 0 0 2.447 6.37z',
};

/**
 * Generic BrandIcon renderer using SimpleIcon metadata.
 */
export function BrandIcon({
  icon,
  size = 16,
  className = '',
  title,
  fill = 'currentColor',
  ...props
}: BrandIconProps) {
  if (!icon) return null;
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={fill}
      className={className}
      aria-hidden={!title}
      {...props}
    >
      {title ? <title>{title}</title> : <title>{icon.title}</title>}
      <path d={icon.path} />
    </svg>
  );
}

function createBrandIcon(icon: SimpleIcon | BrandIconData) {
  const Component = ({ size = 16, className = '', title, fill = 'currentColor', ...props }: Omit<BrandIconProps, 'icon'>) => (
    <BrandIcon icon={icon} size={size} className={className} title={title} fill={fill} {...props} />
  );
  Component.displayName = icon.title.replace(/\s+/g, '');
  return Component;
}

// Direct typed exports for brand & tech icons
export const SiGithub = createBrandIcon(siGithub);
export const SiLinkedin = createBrandIcon(customLinkedin);
export const SiX = createBrandIcon(siX);
export const SiTypescript = createBrandIcon(siTypescript);
export const SiJavascript = createBrandIcon(siJavascript);
export const SiReact = createBrandIcon(siReact);
export const SiAstro = createBrandIcon(siAstro);
export const SiCloudflare = createBrandIcon(siCloudflare);
export const SiPython = createBrandIcon(siPython);
export const SiGo = createBrandIcon(siGo);
export const SiDocker = createBrandIcon(siDocker);
export const SiTailwindcss = createBrandIcon(siTailwindcss);
export const SiPostgresql = createBrandIcon(siPostgresql);
export const SiNodedotjs = createBrandIcon(siNodedotjs);
export const SiNextdotjs = createBrandIcon(siNextdotjs);
export const SiRedis = createBrandIcon(siRedis);
export const SiGraphql = createBrandIcon(siGraphql);
export const SiGit = createBrandIcon(siGit);
export const SiLinux = createBrandIcon(siLinux);
export const SiOpenai = createBrandIcon(customOpenai);
export const SiAnthropic = createBrandIcon(siAnthropic);
export const SiHuggingface = createBrandIcon(siHuggingface);
export const SiRust = createBrandIcon(siRust);
export const SiFastapi = createBrandIcon(siFastapi);
export const SiHono = createBrandIcon(siHono);
export const SiTurborepo = createBrandIcon(siTurborepo);
export const SiVite = createBrandIcon(siVite);
export const SiVitest = createBrandIcon(siVitest);
export const SiPlaywright = createBrandIcon(customPlaywright);
export const SiBash = createBrandIcon(siGnubash);
export const SiHtml5 = createBrandIcon(siHtml5);
export const SiCss = createBrandIcon(siCss);
export const SiExpress = createBrandIcon(siExpress);
export const SiRedux = createBrandIcon(siRedux);
export const SiSass = createBrandIcon(siSass);
export const SiNpm = createBrandIcon(siNpm);
export const SiYarn = createBrandIcon(siYarn);
export const SiJest = createBrandIcon(siJest);
export const SiElasticsearch = createBrandIcon(siElasticsearch);
export const SiGithubActions = createBrandIcon(siGithubactions);

/**
 * Normalized tech name lookup dictionary
 */
export const TECH_ICONS: Record<string, SimpleIcon | BrandIconData> = {
  typescript: siTypescript,
  javascript: siJavascript,
  html: siHtml5,
  html5: siHtml5,
  css: siCss,
  css3: siCss,
  bash: siGnubash,
  react: siReact,
  'react.js': siReact,
  nextjs: siNextdotjs,
  'next.js': siNextdotjs,
  nodejs: siNodedotjs,
  'node.js': siNodedotjs,
  express: siExpress,
  'express.js': siExpress,
  redux: siRedux,
  tailwind: siTailwindcss,
  'tailwind css': siTailwindcss,
  tailwindcss: siTailwindcss,
  sass: siSass,
  git: siGit,
  github: siGithub,
  npm: siNpm,
  yarn: siYarn,
  vite: siVite,
  'github actions': siGithubactions,
  jest: siJest,
  docker: siDocker,
  linux: siLinux,
  elasticsearch: siElasticsearch,
  astro: siAstro,
  cloudflare: siCloudflare,
  python: siPython,
  go: siGo,
  postgresql: siPostgresql,
  redis: siRedis,
  graphql: siGraphql,
  openai: customOpenai,
  anthropic: siAnthropic,
  huggingface: siHuggingface,
  rust: siRust,
  fastapi: siFastapi,
  hono: siHono,
  turborepo: siTurborepo,
  vitest: siVitest,
  playwright: customPlaywright,
  linkedin: customLinkedin,
  x: siX,
};

/**
 * Helper to render a brand icon by tech name
 */
export function TechIcon({
  name,
  size = 14,
  className = '',
  ...props
}: {
  name: string;
  size?: number | string;
  className?: string;
} & SVGProps<SVGSVGElement>) {
  const normalized = name.toLowerCase().trim();
  const icon = TECH_ICONS[normalized];
  if (!icon) return null;
  return <BrandIcon icon={icon} size={size} className={className} title={name} {...props} />;
}



