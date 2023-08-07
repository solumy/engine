import { FilterDto } from '@adapter/api/app/dtos/FilterDto'
import { App } from '@domain/entities/app/App'
import { ApiError } from '@domain/entities/app/errors/ApiError'
import { RequestDto } from '@adapter/spi/server/dtos/RequestDto'
import { NumberField } from '@domain/entities/table/fields/NumberField'
import { Currency } from '@domain/entities/table/fields/Currency'
import { SingleLineText } from '@domain/entities/table/fields/SingleLineText'
import { LongText } from '@domain/entities/table/fields/LongText'
import { SingleSelect } from '@domain/entities/table/fields/SingleSelect'
import { Datetime } from '@domain/entities/table/fields/Datetime'
import { MultipleLinkedRecords } from '@domain/entities/table/fields/MultipleLinkedRecords'
import { Formula } from '@domain/entities/table/fields/Formula'
import { Rollup } from '@domain/entities/table/fields/Rollup'
import { RecordDto } from '@adapter/api/app/dtos/RecordDto'
import { FilterMapper } from '@adapter/api/app/mappers/FilterMapper'
import { Filter } from '@domain/entities/app/Filter'
import { RecordMapper } from '@adapter/api/app/mappers/RecordMapper'
import { Record, RecordState } from '@domain/entities/app/Record'
import { OrmGateway } from '@adapter/spi/orm/OrmGateway'
import { validateRecordDto, validateSyncDto } from '../utils/AjvUtils'
import { SyncResource } from '@domain/entities/app/Sync'
import { SyncResourceMapper } from '../app/mappers/sync/SyncResourceMapper'

export class TableMiddleware {
  constructor(
    private app: App,
    private ormGateway: OrmGateway
  ) {}

  public async validateTableExist(request: RequestDto): Promise<string> {
    const { table } = request.params ?? {}
    const exist = await this.ormGateway.tableExists(table)
    if (!exist) throw new ApiError(`Table ${table} does not exist`, 404)
    return table
  }

  public async extractAndValidateQuery(request: RequestDto): Promise<Filter[]> {
    const { query } = request
    const filters: FilterDto[] = []
    if (query) {
      for (const key in query) {
        const matchFilter = key.match(/filter_(field|operator|value)_(\d+)$/)
        if (matchFilter) {
          const index = Number(matchFilter[2])
          const value = query[key]
          filters[index] = filters[index] || {}
          if (key.startsWith('filter_field_')) {
            filters[index].field = value
          } else if (key.startsWith('filter_operator_')) {
            if (value === 'is_any_of') {
              filters[index].operator = value
            } else {
              throw new Error(`Operator ${value} is not supported`)
            }
          } else if (key.startsWith('filter_value_')) {
            if (filters[index].operator === 'is_any_of') {
              filters[index].value = value.split(',')
            }
          }
        }
      }
    }
    return FilterMapper.toEntities(filters)
  }

  public async validateSyncBody(
    body: unknown
  ): Promise<{ records: Record[]; resources: SyncResource[] }> {
    if (validateSyncDto(body)) {
      const { commands: commandsDto = [], resources: resourcesDto = [] } = body
      const records = await Promise.all(
        commandsDto.map((commandDto) => {
          const { type, table, record: recordDto } = commandDto
          return this.validateRecordValues(table, recordDto, type)
        })
      )
      const resources = SyncResourceMapper.toEntities(resourcesDto)
      return { records, resources }
    }
    throw new ApiError(`Invalid sync body`, 400)
  }

  public async validateRecordExist(request: RequestDto): Promise<string> {
    const { table, id } = request.params ?? {}
    const record = await this.ormGateway.read(table, id)
    if (!record) throw new ApiError(`Record ${id} does not exist in table ${table}`, 404)
    return id
  }

  public async validateRecordBody(
    table: string,
    body: unknown,
    state: RecordState
  ): Promise<Record> {
    if (validateRecordDto(body)) return this.validateRecordValues(table, body, state)
    throw new ApiError(`Invalid record body`, 400)
  }

  public async validateRecordsBody(
    table: string,
    body: unknown[],
    state: RecordState
  ): Promise<Record[]> {
    const records = []
    for (const record of body) {
      records.push(this.validateRecordBody(table, record, state))
    }
    return Promise.all(records)
  }

  public async validateRecordValues(
    table: string,
    record: RecordDto,
    state: RecordState
  ): Promise<Record> {
    const { tables } = this.app
    const { fields = [] } = tables.find((t) => t.name === table) ?? {}
    const errors = []
    const values = { ...record }

    for (const field of fields) {
      if (!field) {
        throw new Error(`field "${field}" does not exist in table ${table}`)
      }
      const value = values[field.name]
      delete values[field.name]

      if (field instanceof Formula || field instanceof Rollup) {
        if (value) delete record[field.name]
        continue
      }

      if (!value && (state === 'update' || field.optional || field.default)) {
        continue
      }

      if (!field.optional && !field.default && value == null && field.type !== 'Boolean') {
        errors.push(`field "${field.name}" is required`)
      }

      if ((field instanceof NumberField || field instanceof Currency) && value) {
        const number = Number(value)
        if (isNaN(number)) {
          errors.push(`field "${field.name}" must be a number`)
        } else {
          record[field.name] = number
        }
      }

      if (
        (field instanceof SingleLineText ||
          field instanceof LongText ||
          field instanceof SingleSelect) &&
        value &&
        typeof value !== 'string'
      ) {
        errors.push(`field "${field.name}" must be a string`)
      }

      if (field instanceof Datetime && value) {
        const date = new Date(String(value))
        if (isNaN(date.getTime())) {
          errors.push(`field "${field.name}" must be a valid date`)
        } else {
          record[field.name] = date.toISOString()
        }
      }

      if (field.type === 'checkbox' && value && typeof value !== 'boolean') {
        errors.push(`field "${field}" must be a boolean`)
      }

      if (field instanceof MultipleLinkedRecords && value) {
        if (Array.isArray(value)) {
          for (const v of value) {
            if (typeof v !== 'string') {
              throw new Error(`field "${field.name}" must be an array of string`)
            }
          }
        } else {
          errors.push(`field "${field.name}" must be an array`)
        }
      }
    }

    if (Object.keys(values).length > 0) {
      errors.push(`Invalid fields: ${Object.keys(values).join(', ')}`)
    }

    if (errors.length > 0) throw new ApiError(`Invalid record values :\n${errors.join('\n')}`, 400)

    return RecordMapper.toEntity(record, this.app.getTableByName(table), state)
  }
}