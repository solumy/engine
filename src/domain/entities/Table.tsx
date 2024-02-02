import type { DatabaseTable } from '@domain/services/DatabaseTable'
import type { Server } from '@domain/services/Server'
import type { Database } from '@domain/services/Database'
import type { Logger } from '@domain/services/Logger'
import type { Field } from './Field'
import type { Engine } from './Engine'
import type { Record } from '@domain/services/Record'
import type { ToCreateData } from '@domain/services/Record/ToCreate'
import { Json } from '@domain/services/Response/JSON'

export interface TableConfig {
  name: string
  fields: Field[]
}

export interface TableParams {
  server: Server
  database: Database
  logger: Logger
  record: Record
}

export class Table implements Engine {
  private database: DatabaseTable

  constructor(
    private config: TableConfig,
    private params: TableParams
  ) {
    const { database, logger, server } = params
    this.database = database.table(this.name)
    server.post(this.path, this.post)
    logger.log(`POST mounted on ${this.path}`)
  }

  get name() {
    return this.config.name
  }

  get fields() {
    return this.config.fields
  }

  get path() {
    return `/api/table/${this.name}`
  }

  post = async ({ body }: { body: unknown }) => {
    // TODO: validate body
    const toCreateRecord = this.params.record.create(body as ToCreateData)
    const persistedRecord = await this.database.insert(toCreateRecord)
    return new Json({ record: persistedRecord.data })
  }

  validateConfig() {
    return []
  }
}
