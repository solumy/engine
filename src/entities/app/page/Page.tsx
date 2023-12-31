import React from 'react'
import { TableList } from '../table/TableList'
import { Context } from './context/Context'
import { PageParams } from './PageParams'
import { Component, newComponent } from './component/Component'
import { PageServices } from './PageServices'
import { AppConfig } from '../AppConfig'

export interface PageConfig {
  tables: TableList
  formTableName?: string
}

export class Page {
  readonly path: string
  readonly title?: string
  readonly components: Component[]

  constructor(
    readonly params: PageParams,
    services: PageServices,
    config: AppConfig
  ) {
    this.path = params.path
    this.title = params.title
    this.components = params.components.map((componentParams) =>
      newComponent(componentParams, services, config)
    )
  }

  async render(context: Context) {
    const Components = await Promise.all(
      this.components.map((component) => component.render(context))
    )
    return () => {
      return (
        <>
          {Components.map((Component, index) => {
            return <Component key={index} />
          })}
        </>
      )
    }
  }
}
