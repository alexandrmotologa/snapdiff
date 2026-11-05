import fs from 'node:fs';
import path from 'node:path';

/**
 * Ensures parent directories exist and writes binary buffer to file.
 */
export async function writeImageFile(filePath: string, buffer: Buffer): Promise<void> {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  await fs.promises.writeFile(filePath, buffer);
}

/**
 * Reads binary image file from disk, returning null if missing.
 */
export async function readImageFile(filePath: string): Promise<Buffer | null> {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return fs.promises.readFile(filePath);
}
