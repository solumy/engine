import type { Field } from './Field'

export interface Table {
  name: string
  fields: Field[]
}

export type TableSchema = Table
