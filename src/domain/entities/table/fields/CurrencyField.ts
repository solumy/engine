import { BaseField } from './BaseField'

export class CurrencyField extends BaseField {
  constructor(name: string, optional?: boolean, defaultValue?: number) {
    super(name, 'currency', optional, 'number', defaultValue)
  }
}