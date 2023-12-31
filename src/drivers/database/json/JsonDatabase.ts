import fs from 'fs-extra'
import { join } from 'path'
import { DatabaseOptions } from '../index'
import { TableParams } from '@entities/app/table/TableParams'
import { PersistedRecordDto, RecordToDeleteDto, RecordToUpdateDto } from '@adapters/dtos/RecordDto'
import { FilterDto } from '@adapters/dtos/FilterDto'
import { IDatabaseDriver } from '@adapters/mappers/database/IDatabaseDriver'

interface Database {
  [key: string]: PersistedRecordDto[]
}

export class JsonDatabase implements IDatabaseDriver {
  private url: string
  private tables: TableParams[] = []

  constructor(options: DatabaseOptions) {
    const folder = options.folder ?? process.cwd()
    this.url = join(folder, 'db.json')
    if (fs.existsSync(this.url)) return
    fs.ensureFileSync(this.url)
    fs.writeJSONSync(this.url, {})
  }

  public async configure(tables: TableParams[]): Promise<void> {
    this.tables = tables
  }

  public tableExists(tableName: string): boolean {
    return this.tables.some((table) => table.name === tableName)
  }

  private getTable(tableName: string): TableParams {
    const table = this.tables.find((table) => table.name === tableName)
    if (!table) throw new Error(`Table ${tableName} not found`)
    return table
  }

  public async getDB(): Promise<Database> {
    return fs.readJSON(this.url, { throws: false }) || {}
  }

  public async setDB(db: Database): Promise<void> {
    await fs.outputJSON(this.url, db, { spaces: 2 })
  }

  async create(tableName: string, record: PersistedRecordDto): Promise<PersistedRecordDto> {
    const db = await this.getDB()
    if (!db[tableName]) db[tableName] = []
    const autonumberField = this.getTable(tableName).fields.find(
      (field) => field.type === 'autonumber'
    )
    if (autonumberField) {
      const autonumber = db[tableName].length + 1
      record = { ...record, [autonumberField.name]: autonumber }
    }
    db[tableName].push(record)
    await this.setDB(db)
    return record
  }

  async createMany(
    tableName: string,
    records: PersistedRecordDto[]
  ): Promise<PersistedRecordDto[]> {
    const db = await this.getDB()
    if (!db[tableName]) db[tableName] = []
    const autonumberField = this.getTable(tableName).fields.find(
      (field) => field.type === 'autonumber'
    )
    if (autonumberField) {
      const autonumber = db[tableName].length + 1
      records = records.map((record) => ({
        ...record,
        [autonumberField.name]: autonumber,
      }))
    }
    db[tableName].push(...records)
    await this.setDB(db)
    return records
  }

  async update(
    table: string,
    record: RecordToUpdateDto | RecordToDeleteDto
  ): Promise<PersistedRecordDto> {
    const db = await this.getDB()
    if (!db[table]) db[table] = []
    const index = db[table].findIndex((row) => row.id === record.id)
    if (index === -1) throw new Error(`Record ${record.id} not found`)
    db[table][index] = { ...db[table][index], ...record }
    await this.setDB(db)
    return db[table][index]
  }

  async updateMany(
    table: string,
    records: (RecordToUpdateDto | RecordToDeleteDto)[]
  ): Promise<PersistedRecordDto[]> {
    const db = await this.getDB()
    if (!db[table]) db[table] = []
    const persistedRecords = []
    for (const record of records) {
      const index = db[table].findIndex((row) => row.id === record.id)
      if (index === -1) throw new Error(`Record ${record.id} not found`)
      db[table][index] = { ...db[table][index], ...record }
      persistedRecords.push(db[table][index])
    }
    await this.setDB(db)
    return persistedRecords
  }

  async list(table: string, filters: FilterDto[] = []): Promise<PersistedRecordDto[]> {
    const db = await this.getDB()
    if (!db[table]) db[table] = []
    const records = db[table]
    if (filters.length === 0) return records
    return records.filter((record) => {
      for (const filter of filters) {
        const value = record[filter.field]
        const field = this.getTable(table).fields.find((field) => field.name === filter.field)
        if (filter.operator === 'is_any_of') {
          if (!Array.isArray(filter.value)) throw new Error('Value must be an array')
          if (filter.field === 'id' || field?.format === 'text')
            return filter.value.map((v) => String(v)).filter((v: string) => v === value).length > 0
          if (field?.format === 'number')
            return filter.value.map((v) => Number(v)).filter((v: number) => v === value).length > 0
        }
        throw new Error(`Operator ${filter.operator} not supported`)
      }
    })
  }

  async read(table: string, id: string): Promise<PersistedRecordDto | undefined> {
    const db = await this.getDB()
    if (!db[table]) db[table] = []
    const recordDto = db[table].find((row) => row.id === id)
    if (!recordDto) return undefined
    return recordDto
  }
}
