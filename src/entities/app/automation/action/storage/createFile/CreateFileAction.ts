import { BaseAction } from '../../base/BaseAction'
import { File } from '@entities/services/storage/file/File'
import { ITemplaterMapper } from '@entities/services/templater/ITemplaterMapper'
import { AutomationConfig, AutomationContext } from '../../../Automation'
import { CreateFileActionParams } from './CreateFileActionParams'
import { Bucket } from '@entities/app/bucket/Bucket'
import { AutomationServices } from '@entities/app/automation/AutomationServices'

type DataCompiled = { [key: string]: ITemplaterMapper | string }
type DataRendered = {
  [key: string]: string | DataRendered | DataRendered[]
}

export class CreateFileAction extends BaseAction {
  private bucket: Bucket
  private filename: string
  private filenameCompiled: ITemplaterMapper
  private template: string
  private templateCompiled: ITemplaterMapper
  private dataCompiled: DataCompiled

  constructor(
    params: CreateFileActionParams,
    services: AutomationServices,
    config: AutomationConfig
  ) {
    const { name, type, filename, input, output, template, bucket, data } = params
    const { storage, templater } = services
    super({ name, type }, services, config)
    this.bucket = this.getBucketByName(bucket)
    this.filename = filename.endsWith(`.${output}`) ? filename : `${filename}.${output}`
    this.filenameCompiled = templater.compile(this.filename)
    if (input === 'html') {
      if (typeof template === 'object' && 'path' in template) {
        this.template = storage.readStaticFile(template.path)
      } else {
        this.template = template
      }
      this.templateCompiled = templater.compile(this.template)
    } else {
      this.throwError(`Input "${input}" not supported`)
    }
    this.dataCompiled = Object.entries(data).reduce((acc: DataCompiled, [key, value]) => {
      acc[key] = !key.includes('$') ? templater.compile(value) : value
      return acc
    }, {})
  }

  async execute(context: AutomationContext): Promise<{ [key: string]: AutomationContext }> {
    const filename = this.filenameCompiled.render(context)
    const data = Object.entries(this.dataCompiled).reduce((acc: DataRendered, [key, value]) => {
      if (typeof value === 'string') {
        if (key.includes('$')) {
          const [rootKey, , arrayKey] = key.split('.')
          let array: DataRendered[] = []
          const defaultValue = acc[rootKey]
          if (defaultValue && Array.isArray(defaultValue)) {
            array = defaultValue
          }
          const contextPath = value.replace('{{', '').replace('}}', '').trim()
          const [contextRootPath, contextArrayKey] = contextPath.split('.$.')
          const contextValue = super.getValueFromPath(context, contextRootPath)
          if (contextValue && Array.isArray(contextValue)) {
            for (const [index, item] of contextValue.entries()) {
              if (!array[index]) {
                array[index] = {}
              }
              if (item[contextArrayKey]) {
                array[index][arrayKey] = item[contextArrayKey]
              }
            }
          }
          acc[rootKey] = array
        } else {
          acc[key] = value
        }
      } else {
        acc[key] = value.render(context)
      }
      return acc
    }, {})
    const template = this.templateCompiled.render(data)
    const pdfData = await this.services.converter.htmlToPdf(template)
    const file = new File(pdfData, { filename })
    const url = await this.services.storage.upload(this.bucket, file)
    return { [this.name]: { filename, url } }
  }
}
