import { execSync } from 'node:child_process';

export interface GitInfo {
  branch?: string;
  commit?: string;
  author?: string;
  message?: string;
}

/**
 * Extracts Git repository metadata if available.
 */
export function getGitMetadata(cwd = process.cwd()): GitInfo | undefined {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
    const commit = execSync('git rev-parse HEAD', { cwd, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
    const author = execSync('git log -1 --pretty=format:%an', { cwd, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
    const message = execSync('git log -1 --pretty=format:%s', { cwd, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();

    return {
      branch,
      commit: commit.slice(0, 8),
      author,
      message
    };
  } catch {
    return undefined;
  }
}
