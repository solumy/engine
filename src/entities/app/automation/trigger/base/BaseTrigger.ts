import { AutomationConfig } from '../../Automation'
import { BaseTriggerParams } from './BaseTriggerParams'
import { Table } from '@entities/app/table/Table'
import { TriggerError } from '../TriggerError'
import { FilterParams } from '@entities/services/database/filter/FilterParams'
import { Filter, newFilter } from '@entities/services/database/filter/Filter'
import { TriggerParams } from '../TriggerParams'
import { AutomationServices } from '../../AutomationServices'

export class BaseTrigger {
  readonly event: TriggerParams['event']

  constructor(
    options: BaseTriggerParams,
    readonly services: AutomationServices,
    readonly config: AutomationConfig
  ) {
    const { event } = options
    this.event = event
  }

  throwError(message: string): never {
    throw new TriggerError(this.event, message, this.config.automationName)
  }

  getTableByName(tableName: string): Table {
    const table = this.config.tables.getByName(tableName)
    if (!table) this.throwError(`table "${tableName}" is not defined in tables`)
    return table
  }

  getFiltersFromParams(filtersParams: FilterParams[]): Filter[] {
    return filtersParams.map((filterParams: FilterParams) => newFilter(filterParams))
  }
}
