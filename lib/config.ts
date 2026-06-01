/** Baked-in default; production builds override via GitHub Actions variables. */
export const DEFAULT_GITHUB_REPO = "meowdule/scopurl";

/** GitHub Pages project-site path for meowdule/scopurl */
export const DEFAULT_BASE_PATH = "/scopurl";

export function getConfiguredRepo(): string {
  const fromEnv = process.env.NEXT_PUBLIC_GITHUB_REPO?.trim();
  if (fromEnv) return fromEnv;
  return DEFAULT_GITHUB_REPO;
}

export function hasBuildTimeRepo(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_GITHUB_REPO?.trim());
}
