import { SingleSelectRecordInputDto } from '@adapter/api/page/dtos/components/inputs/SingleSelectRecordInputDto'
import { SingleSelectRecordInput } from '@domain/entities/page/components/inputs/SingleSelectRecordInput'
import { IUISpi } from '@domain/spi/IUISpi'

export class SingleSelectRecordInputMapper {
  static toEntity(
    singleSelectRecordInputDto: SingleSelectRecordInputDto,
    ui: IUISpi,
    linkedTable: string
  ): SingleSelectRecordInput {
    const { label, field, placeholder, linkedLabelField } = singleSelectRecordInputDto
    return new SingleSelectRecordInput(
      field,
      ui.SingleSelectRecordInputUI,
      linkedTable,
      label,
      placeholder,
      linkedLabelField
    )
  }

  static toDto(singleSelectRecordInput: SingleSelectRecordInput): SingleSelectRecordInputDto {
    const { label, field, placeholder, linkedLabelField } = singleSelectRecordInput
    return {
      label,
      field,
      placeholder,
      linkedLabelField,
    }
  }

  static toEntities(
    singleSelectRecordInputDtos: SingleSelectRecordInputDto[],
    ui: IUISpi,
    linkedTable: string
  ): SingleSelectRecordInput[] {
    return singleSelectRecordInputDtos.map((singleSelectRecordInputDto) =>
      this.toEntity(singleSelectRecordInputDto, ui, linkedTable)
    )
  }

  static toDtos(singleSelectRecordInputs: SingleSelectRecordInput[]): SingleSelectRecordInputDto[] {
    return singleSelectRecordInputs.map((singleSelectRecordInput) =>
      this.toDto(singleSelectRecordInput)
    )
  }
}
