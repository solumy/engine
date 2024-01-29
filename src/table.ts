import { Table } from '@domain/entities/table/Table'
import { drivers } from '@drivers/index'
import { TableError } from '@domain/entities/table/TableError'
import type { EngineError } from '@domain/entities/EngineError'
import { TableController } from './adapter/controllers/TableController'

export async function createTable(
  config: unknown
): Promise<{ table?: Table; errors: EngineError[] }> {
  const tableController = new TableController(drivers)
  const { entity, errors } = await tableController.createEntity(config)
  return { table: entity, errors }
}

export type { ITable } from '@domain/entities/table/ITable'
export { TableError }
