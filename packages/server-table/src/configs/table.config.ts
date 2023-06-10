import debug from 'debug'
import { ConfigUtils, SchemaUtils } from 'server-common'
import { DatabaseProviderInterface } from 'server-database'
import { TableFieldsInterface, TableSchema } from 'shared-table'

import type { TablesInterface } from 'shared-table'
import type { ConfigExecInterface } from 'server-common'

const log: debug.IDebugger = debug('config:table')

class TableConfig implements ConfigExecInterface {
  private configUtils: ConfigUtils
  private databaseProvider: DatabaseProviderInterface
  private tablesConfig: TablesInterface

  constructor({
    configUtils,
    databaseProvider,
  }: {
    configUtils: ConfigUtils
    databaseProvider: DatabaseProviderInterface
  }) {
    this.configUtils = configUtils
    this.databaseProvider = databaseProvider
    this.tablesConfig = configUtils.get('tables') as TablesInterface
  }

  public async enrichSchema() {
    const tables = this.tablesConfig
    const defaultFields: TableFieldsInterface = {
      id: {
        type: 'String',
        primary: true,
        default: 'cuid()',
      },
      created_at: {
        type: 'DateTime',
        default: 'now()',
      },
      updated_at: {
        type: 'DateTime',
        optional: true,
      },
      deleted_at: {
        type: 'DateTime',
        optional: true,
      },
    }
    for (const table in tables) {
      const { fields } = tables[table]
      if (typeof fields === 'object') {
        tables[table].fields = { ...fields, ...defaultFields }
      } else {
        tables[table].fields = defaultFields
      }
    }
    this.configUtils.set('tables', tables)
  }

  public async validateSchema() {
    const tables = this.tablesConfig
    const schema = new SchemaUtils(TableSchema)
    for (const table in tables) {
      log(`validate schema ${table}`)
      schema.validate(tables[table])
    }
  }

  public async setupProviders() {
    const tables = this.tablesConfig
    for (const table in tables) {
      log(`add database table ${table}`)
      this.databaseProvider.addTableSchema(table, tables[table])
    }
  }
}

export default TableConfig
