// GitHub username rules: alphanumeric or single hyphens, no leading/trailing
// or double hyphen, max 39 characters. The Python CLI never validated this
// since it trusted argv; the web API is a public input boundary so it must.
const GITHUB_USERNAME_PATTERN = /^[a-zA-Z\d](?:[a-zA-Z\d]|-(?=[a-zA-Z\d])){0,38}$/;

export function isValidGithubUsername(input: unknown): input is string {
  return typeof input === "string" && GITHUB_USERNAME_PATTERN.test(input);
}
