import { JSONSchemaType } from '@adapter/api/utils/AjvUtils'
import { BaseFieldDto, BaseFieldDtoSchema } from './BaseFieldDto'

export interface NumberDto extends BaseFieldDto {
  type: 'number'
}

export const NumberDtoSchema: JSONSchemaType<NumberDto> = {
  type: 'object',
  properties: {
    ...BaseFieldDtoSchema.properties,
    type: { type: 'string', enum: ['number'] },
  },
  required: [...BaseFieldDtoSchema.required, 'type'],
  additionalProperties: false,
}