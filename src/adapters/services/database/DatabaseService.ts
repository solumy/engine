import { Filter, newFilter } from '@entities/services/database/filter/Filter'
import { Emit } from '@entities/app/automation/AutomationList'
import { IDatabaseDriver } from './IDatabaseDriver'
import { RecordToCreate } from '../../../entities/services/database/record/state/toCreate/RecordToCreate'
import { RecordToUpdate } from '../../../entities/services/database/record/state/toUpdate/RecordToUpdate'
import { PersistedRecord } from '../../../entities/services/database/record/state/persisted/PersistedRecord'
import { Table } from '@entities/app/table/Table'
import { IDatabaseService } from '@entities/services/database/IDatabaseService'
import { RecordData } from '@entities/services/database/record/RecordData'
import { FormulaField } from '@entities/app/table/field/formula/FormulaField'
import { RollupField } from '@entities/app/table/field/rollup/RollupField'
import { MultipleLinkedRecordsField } from '@entities/app/table/field/multipleLinkedRecords/MultipleLinkedRecordsField'
import { Scripter } from '@entities/services/scripter/Scripter'
import { TableList } from '@entities/app/table/TableList'
import { RecordToDelete } from '@entities/services/database/record/state/toDelete/RecordToDelete'

export class DatabaseService implements IDatabaseService {
  private emit?: Emit
  private tables: TableList | undefined

  constructor(private readonly driver: IDatabaseDriver) {}

  async configure(tables: TableList): Promise<void> {
    this.tables = tables
    await this.driver.configure(tables.getAllParams())
  }

  async listen(emit: Emit) {
    this.emit = emit
  }

  async tableExists(table: string): Promise<boolean> {
    return this.driver.tableExists(table)
  }

  async create(table: Table, record: RecordToCreate): Promise<string> {
    const recordData = record.data()
    const id = await this.driver.create(table.name, recordData)
    if (this.emit) {
      const persistedRecord = await this.buildPersistedRecord(recordData, table)
      await this.emit({
        event: 'record_created',
        context: { table: table.name, record: persistedRecord.dataWithLinkedRecordsData() },
      })
    }
    return id
  }

  async createMany(table: Table, records: RecordToCreate[]): Promise<string[]> {
    const recordsData = records.map((r) => r.data())
    const ids = await this.driver.createMany(table.name, recordsData)
    if (this.emit)
      for (const record of records) {
        const persistedRecord = await this.buildPersistedRecord(record.data(), table)
        await this.emit({
          event: 'record_created',
          context: { table: table.name, record: persistedRecord.dataWithLinkedRecordsData() },
        })
      }
    return ids
  }

  async softUpdate(table: Table, record: RecordToUpdate): Promise<void> {
    const recordData = record.toUpdateData()
    await this.driver.update(table.name, recordData)
    if (this.emit) {
      const persistedRecord = await this.buildPersistedRecord(record.data(), table)
      await this.emit({
        event: 'record_updated',
        context: {
          table: table.name,
          record: persistedRecord.dataWithLinkedRecordsData(),
          updatedFields: record.updatedFields,
        },
      })
    }
  }

  async softUpdateMany(table: Table, records: RecordToUpdate[]): Promise<void> {
    const recordsData = records.map((r) => r.toUpdateData())
    await this.driver.updateMany(table.name, recordsData)
    if (this.emit)
      for (const record of records) {
        const persistedRecord = await this.buildPersistedRecord(record.data(), table)
        await this.emit({
          event: 'record_updated',
          context: {
            table: table.name,
            record: persistedRecord.dataWithLinkedRecordsData(),
            updatedFields: record.updatedFields,
          },
        })
      }
  }

  async softDelete(table: Table, record: RecordToDelete): Promise<void> {
    const recordData = record.toDeleteData()
    await this.driver.update(table.name, recordData)
    //if (this.emit) await this.emit('record_deleted', { table: table.name, record: recordData })
  }

  async softDeleteMany(table: Table, records: RecordToDelete[]): Promise<void> {
    const recordsData = records.map((r) => r.toDeleteData())
    await this.driver.updateMany(table.name, recordsData)
    //if (this.emit) for (const id of ids) await this.emit('record_deleted', { table: table.name, id })
  }

  async list(table: Table, filters: Filter[]): Promise<PersistedRecord[]> {
    const filtersParams = filters.map((f) => f.params)
    const recordsData = await this.driver.list(table.name, filtersParams)
    return Promise.all(
      recordsData.map((recordData) => this.buildPersistedRecord(recordData, table))
    )
  }

  async read(table: Table, id: string): Promise<PersistedRecord | undefined> {
    const recordData = await this.driver.read(table.name, id)
    if (!recordData) return undefined
    return this.buildPersistedRecord(recordData, table)
  }

  private async buildPersistedRecord(recordData: RecordData, table: Table) {
    const record = new PersistedRecord(recordData, table)
    await this.runRecordFormulas(record, table)
    await this.replaceLinkedRecordsIdsByData(record, table)
    return record
  }

  private async runRecordFormulas(record: PersistedRecord, table: Table): Promise<void> {
    if (table.fields.length > 0) {
      for (const field of table.fields)
        if (field instanceof RollupField) {
          const value = await this.runFieldRollupFormula(record, field, table)
          record.setCalculatedFieldValue(field.name, value)
        }
      for (const field of table.fields)
        if (field instanceof FormulaField) {
          const value = await this.runFieldFormula(record, field)
          record.setCalculatedFieldValue(field.name, value)
        }
    }
  }

  private async runFieldRollupFormula(
    record: PersistedRecord,
    fieldRollup: RollupField,
    table: Table
  ) {
    const { formula } = fieldRollup
    const field = table.fields.find((f) => f.name === fieldRollup.linkedRecords)
    if (!field || !(field instanceof MultipleLinkedRecordsField))
      throw new Error(`Field "${fieldRollup.linkedRecords}" not found in runFieldRollupFormula`)
    const values = record.getFieldValue(field.name)
    if (!Array.isArray(values)) throw new Error('Values are not an array')
    const linkedRecords = await this.list(this.getTableByName(field.table), [
      newFilter({ field: 'id', operator: 'is_any_of', value: values }),
    ])
    const context = {
      values: linkedRecords.map((record) => String(record.getFieldValue(fieldRollup.linkedField))),
    }
    return new Scripter(formula, context).run()
  }

  private async runFieldFormula(record: PersistedRecord, fieldFormula: FormulaField) {
    const { formula } = fieldFormula
    return new Scripter(formula, record.data()).run()
  }

  private getTableByName(tableName: string): Table {
    const table = this.tables?.getByName(tableName)
    if (!table) throw new Error(`Table "${tableName}" not found`)
    return table
  }

  async replaceLinkedRecordsIdsByData(
    record: PersistedRecord,
    table: Table
  ): Promise<PersistedRecord> {
    for (const field of table.fields) {
      if (field instanceof MultipleLinkedRecordsField) {
        const ids = record.getMultipleLinkedRecordsValue(field.name)
        const linkedTable = this.getTableByName(field.table)
        const linkedRecords = await this.list(linkedTable, [
          newFilter({ field: 'id', operator: 'is_any_of', value: ids }),
        ])
        record.setMultipleLinkedRecordsFieldsData(
          field.name,
          linkedRecords.map((record) => record.data())
        )
      }
    }
    return record
  }
}
