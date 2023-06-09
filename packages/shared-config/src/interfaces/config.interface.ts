import type { ObjectInterface } from 'shared-common'
import type { TablesInterface } from 'shared-table'
import type { DatabaseInterface } from 'shared-database'
import type { PagesInterface } from 'shared-page'
import type { ComponentsInterface } from 'shared-component'

export interface ConfigInterface extends ObjectInterface {
  name?: string
  tables?: TablesInterface
  database?: DatabaseInterface
  pages?: PagesInterface
  components?: ComponentsInterface
}

export interface EnvInterface {
  DATABASE_URL?: string
  PORT?: string
  DEBUG?: string
}