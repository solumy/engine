import { FetcherGateway } from '@adapter/spi/gateways/FetcherGateway'
import { Component } from '@domain/entities/page/Component'
import { List } from '@domain/entities/page/components/List'
import { Navigation } from '@domain/entities/page/components/Navigation'
import { RenderPageList } from './RenderPageList'
import { RenderPageNavigation } from './RenderPageNavigation'
import { RenderPageForm } from './RenderPageForm'
import { Form } from '@domain/entities/page/components/Form'
import { AppGateway } from '@adapter/spi/gateways/AppGateway'

export class RenderPageComponent {
  constructor(
    private fetcherGateway: FetcherGateway,
    private appGateway: AppGateway
  ) {}

  execute(component: Component): () => JSX.Element {
    if (component instanceof Navigation) {
      const renderPageNavigation = new RenderPageNavigation(this.fetcherGateway, this.appGateway)
      return renderPageNavigation.execute(component)
    }
    if (component instanceof List) {
      const renderPageList = new RenderPageList(this.fetcherGateway, this.appGateway)
      return renderPageList.execute(component)
    }
    if (component instanceof Form) {
      const renderPageForm = new RenderPageForm(this.fetcherGateway)
      return renderPageForm.execute(component)
    }
    return component.renderUI()
  }
}