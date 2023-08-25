import { InputDto } from '@adapter/api/page/dtos/components/InputDto'
import { TableInputMapper } from './inputs/TableInputMapper'
import { TextInputMapper } from './inputs/TextInputMapper'
import { TextInput } from '@domain/entities/page/components/inputs/TextInput'
import { TableInput } from '@domain/entities/page/components/inputs/TableInput'
import { Input } from '@domain/entities/page/components/Input'
import { IUISpi } from '@domain/spi/IUISpi'
import { Table } from '@domain/entities/table/Table'
import { MultipleLinkedRecordsField } from '@domain/entities/table/fields/MultipleLinkedRecordsField'
import { SingleLinkedRecordField } from '@domain/entities/table/fields/SingleLinkedRecordField'
import { SingleSelectRecordInputMapper } from './inputs/SingleSelectRecordInputMapper'
import { SingleSelectRecordInput } from '@domain/entities/page/components/inputs/SingleSelectRecordInput'

export class InputMapper {
  static toEntity(inputDto: InputDto, ui: IUISpi, tableName: string, tables: Table[]): Input {
    const table = tables.find((table) => table.name === tableName)
    if (!table) {
      throw new Error(`table "${tableName}" is not defined in tables`)
    }
    const field = table.fields.find((field) => field.name === inputDto.field)
    if (!field) {
      throw new Error(`field "${inputDto.field}" is not defined in table ${table}`)
    }
    if (field instanceof MultipleLinkedRecordsField && 'columns' in inputDto) {
      const linkedTable = tables.find((table) => table.name === field.table)
      if (!linkedTable) {
        throw new Error(`linked table "${field.table}" is not defined in tables`)
      }
      return TableInputMapper.toEntity(inputDto, ui, linkedTable)
    }
    if (field instanceof SingleLinkedRecordField) {
      return SingleSelectRecordInputMapper.toEntity(inputDto, ui, field.table)
    }
    return TextInputMapper.toEntity(inputDto, ui)
  }

  static toDto(input: Input): InputDto {
    const { type } = input
    if (input instanceof TextInput) {
      return TextInputMapper.toDto(input)
    }
    if (input instanceof TableInput) {
      return TableInputMapper.toDto(input)
    }
    if (input instanceof SingleSelectRecordInput) {
      return SingleSelectRecordInputMapper.toDto(input)
    }
    throw new Error(`Invalid input type ${type}`)
  }

  static toEntities(
    inputDtos: InputDto[],
    ui: IUISpi,
    tableName: string,
    tables: Table[]
  ): Input[] {
    return inputDtos.map((inputDto) => this.toEntity(inputDto, ui, tableName, tables))
  }

  static toDtos(inputs: Input[]): InputDto[] {
    return inputs.map((input) => this.toDto(input))
  }
}
