import { File } from '../entities/storage/File'

export interface IStorageSpi {
  write(bucket: string, file: File): Promise<string>
  writeMany(bucket: string, files: File[]): Promise<string[]>
  read(bucket: string, filename: string): Promise<File | undefined>
  list(bucket: string, filenames?: string[]): Promise<File[]>
  readStaticPrivateFile(privatePath: string): string
}