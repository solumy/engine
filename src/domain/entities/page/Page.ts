import type { IEntity } from '../IEntity'
import type { IPage } from './IPage'
import type { IPageComponent } from './IPageComponent'
import type { IPageParams } from './IPageParams'
import { PageError } from './PageError'

export class Page implements IEntity {
  name: string

  constructor(
    private config: IPage,
    private params: IPageParams
  ) {
    this.name = config.name
    const { server } = params
    server.get(config.path, this.get)
  }

  get = async () => {
    const {
      components,
      drivers: { ui },
    } = this.params
    const page = ui.createPage()
    for (const { component: name, ...props } of this.config.body) {
      const component = components.find(name)
      if (component) await page.addComponent(component, props)
    }
    const html = page.render()
    return { html }
  }

  validateConfig() {
    const errors: PageError[] = []
    const { components } = this.params
    const { body } = this.config
    const validateComponents = (body: IPageComponent[]) => {
      for (const { component, children } of body) {
        if (!components.includes(component)) {
          errors.push(new PageError('COMPONENT_NOT_FOUND', { component }))
        }
        if (children) validateComponents(children)
      }
    }
    validateComponents(body)
    return errors
  }
}
