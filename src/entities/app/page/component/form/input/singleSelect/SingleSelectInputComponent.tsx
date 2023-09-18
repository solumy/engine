import React from 'react'
import { BaseInputComponent, BaseInputComponentProps } from '../base/BaseInputComponent'
import { SingleSelectInputComponentParams } from './SingleSelectInputComponentParams'
import { SingleSelectInputComponentUI } from './SingleSelectInputComponentUI'
import { FormConfig } from '../../FormComponent'
import { PageServices } from '@entities/app/page/PageServices'

export class SingleSelectInputComponent extends BaseInputComponent {
  readonly placeholder?: string
  readonly options: SingleSelectInputComponentParams['options'] = []

  constructor(
    params: SingleSelectInputComponentParams,
    services: PageServices,
    config: FormConfig
  ) {
    const { type, field, label, placeholder, options: selectParams } = params
    super({ type, field, label }, services, config)
    this.placeholder = placeholder
    this.options = selectParams
  }

  async render() {
    return ({ updateRecord, currentRecord }: BaseInputComponentProps) => {
      const value = currentRecord.getFieldValue(this.field) ?? ''
      const handleUpdateRecord = (e: React.ChangeEvent<HTMLSelectElement>) => {
        e.preventDefault()
        updateRecord(currentRecord.id, e.target.name, e.target.value)
      }
      return (
        <SingleSelectInputComponentUI
          label={this.label}
          field={this.field}
          value={String(value)}
          options={this.options}
          onChange={handleUpdateRecord}
          ui={this.services.ui}
        />
      )
    }
  }
}
