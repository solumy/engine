import { promises as fs } from 'fs'

export async function fsExists(path: string): Promise<boolean> {
  return fs
    .readFile(path)
    .then(() => true)
    .catch(() =>
      fs
        .readdir(path)
        .then(() => true)
        .catch(() => false)
    )
}