import { fakerFR as faker } from '@faker-js/faker'
import { RecordDto } from '@adapter/api/app/dtos/RecordDto'
import { RecordFieldValue } from '@domain/entities/app/Record'
import { getTablesDto } from './schema'
import { TableDto } from '@adapter/api/table/dtos/TableDto'
import { FieldDto } from '@adapter/api/table/dtos/FieldDto'
import { v4 as uuidV4 } from 'uuid'
import { IOrmAdapter } from '@adapter/spi/orm/IOrmAdapter'

export function getTableByName(tableName: string): TableDto {
  const tablesDto = getTablesDto(tableName)
  const tableDto = tablesDto.find((tableDto) => tableDto.name === tableName)
  if (!tableDto) throw new Error(`Table ${tableName} not found`)
  return tableDto
}

export interface RecordDtoTable {
  table: string
  fields: RecordDto
}
export interface RecordsDtoByTables {
  [key: string]: RecordDto[]
}

export type ExtendRecordFieldValue = RecordFieldValue | RecordDto | RecordDto[]

export interface ExtendRecordDto {
  [key: string]: ExtendRecordFieldValue
}

export async function generateRecords(
  ormAdapter: IOrmAdapter,
  tableName: string,
  countOrRecordsDto: number | ExtendRecordDto[] = 1
): Promise<RecordsDtoByTables> {
  const tables = generateRecordsDto(tableName, countOrRecordsDto)
  for (const table in tables) {
    await ormAdapter.createMany(table, tables[table])
  }
  return tables
}

export function generateRecordsDto(
  tableName: string,
  countOrRecordsDto: number | ExtendRecordDto[] = 1
): RecordsDtoByTables {
  const tableDto = getTableByName(tableName)
  const records: RecordDtoTable[] = []
  const length =
    typeof countOrRecordsDto === 'number' ? countOrRecordsDto : countOrRecordsDto.length
  for (let i = 0; i < length; i++) {
    const defaultValues: ExtendRecordDto =
      typeof countOrRecordsDto !== 'number' ? countOrRecordsDto[i] : {}
    const record: RecordDtoTable = {
      table: tableName,
      fields: {
        id: uuidV4(),
      },
    }
    for (const field of tableDto.fields) {
      const defaultValue = defaultValues[field.name]
      if (defaultValue || !field.optional || (field.optional && Math.random() > 0.5)) {
        if (field.type === 'formula' || field.type === 'rollup') continue
        record.fields[field.name] = generateRandomValueByField(field, records, record, defaultValue)
      }
    }
    records.push(record)
  }
  const tables: RecordsDtoByTables = {}
  for (const record of records) {
    if (!tables[record.table]) tables[record.table] = []
    tables[record.table].push(record.fields)
  }
  return tables
}

export function generateRandomValueByField(
  field: FieldDto,
  records: RecordDtoTable[],
  currentRecord: RecordDtoTable,
  defaultValue: ExtendRecordFieldValue
): RecordFieldValue {
  const { type, name } = field
  if (defaultValue && typeof defaultValue !== 'object') {
    return defaultValue
  } else if (['single_line_text', 'long_text'].includes(type)) {
    if (name.includes('email')) return faker.internet.email()
    if (name.includes('phone')) return faker.phone.number()
    if (name.includes('address')) return faker.location.streetAddress()
    if (name.includes('city')) return faker.location.city()
    if (name.includes('state')) return faker.location.state()
    if (name.includes('zip')) return faker.location.zipCode()
    if (name.includes('country')) return faker.location.country()
    if (name.includes('firstName')) return faker.person.firstName()
    if (name.includes('lastName')) return faker.person.lastName()
    if (name.includes('fullname')) return faker.person.fullName()
    if (name.includes('company') || name.includes('organization') || name.includes('customer'))
      return faker.company.name()
    if (name.includes('domain')) return faker.internet.domainName()
    if (name.includes('title')) return faker.person.jobTitle()
    if (name.includes('description')) return faker.lorem.paragraph()
    if (name.includes('url')) return faker.internet.url()
    if (name.includes('image')) return faker.image.url()
    if (name.includes('color')) return faker.internet.color()
    if (name.includes('username')) return faker.internet.userName()
    if (name.includes('password')) return faker.internet.password()
    if (name.includes('text')) return faker.lorem.text()
    if (name.includes('unit')) return faker.commerce.productName()
    if (name.includes('number')) return String(faker.number.int(1000))
    return faker.word.words()
  } else if (['number'].includes(type)) {
    if (name.includes('quantity')) return faker.number.int(50)
    return faker.number.int(1000)
  } else if (['currency'].includes(type)) {
    if (name.includes('price')) return faker.number.float({ max: 1000, precision: 0.01 })
    return faker.number.float({ precision: 0.01 })
  } else if (type === 'multiple_linked_records') {
    const linkedRecordsdefaultValues: RecordDto[] = []
    const linkedRecords: string[] = []
    if (defaultValue) {
      if (Array.isArray(defaultValue)) {
        for (const value of defaultValue) {
          if (typeof value !== 'string') {
            linkedRecordsdefaultValues.push(value)
          } else {
            linkedRecords.push(value)
          }
        }
      } else {
        throw new Error(
          `multiple_linked_records field ${field.name} must have an array of RecordDto as default value`
        )
      }
    }
    if (linkedRecords.length > 0) return linkedRecords
    const linkedTable = getTableByName(field.table)
    const linkedField = linkedTable.fields.find((f) => f.type === 'single_linked_record')
    if (!linkedField)
      throw new Error(`single_linked_record field not found for table ${field.table}`)
    const { [field.table]: newRecords } = generateRecordsDto(
      field.table,
      Array.from({
        length: linkedRecordsdefaultValues.length > 0 ? linkedRecordsdefaultValues.length : 3,
      }).map((_, index) => ({
        [linkedField.name]: currentRecord.fields.id,
        ...(linkedRecordsdefaultValues[index] ?? {}),
      }))
    )
    const newTableRecords = newRecords.map((record) => ({ table: field.table, fields: record }))
    records.push(...newTableRecords)
    return newTableRecords.map((record) => String(record.fields.id))
  } else if (type === 'single_linked_record') {
    let linkedRecordDefaultValues: RecordDto = {}
    if (
      defaultValue &&
      typeof defaultValue !== 'string' &&
      typeof defaultValue !== 'boolean' &&
      typeof defaultValue !== 'number' &&
      !Array.isArray(defaultValue)
    ) {
      linkedRecordDefaultValues = defaultValue
    } else if (defaultValue && typeof defaultValue === 'string') {
      return defaultValue
    }
    const linkedTable = getTableByName(field.table)
    const linkedField = linkedTable.fields.find((f) => f.type === 'multiple_linked_records')
    if (!linkedField)
      throw new Error(`multiple_linked_records field not found for table ${field.table}`)
    const {
      [field.table]: [record],
    } = generateRecordsDto(field.table, [
      { [linkedField.name]: currentRecord.fields.id, ...linkedRecordDefaultValues },
    ])
    records.push({ table: field.table, fields: record })
    return record.id
  } else if (['datetime'].includes(type)) {
    return faker.date.past().toISOString()
  } else if ('single_select' === type) {
    return field.default ?? faker.helpers.arrayElement(field.options)
  }
  throw new Error(`Unknown type ${type} in faker generator`)
}