// Build metadata, resolved once per build (Vercel injects the git sha at build time).
const sha = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.NEXT_PUBLIC_BUILD_SHA ?? "";
const builtAt = new Date();

export const build = {
  sha: sha ? sha.slice(0, 7) : "local",
  date: builtAt.toISOString().slice(0, 10),
  repo: "https://github.com/vxnsin/vensin-portfolio-v2",
};
