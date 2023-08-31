import React from 'react'
import { Root, hydrateRoot } from 'react-dom/client'
import { PageController } from '@adapter/api/page/PageController'
import { AppMapper } from '@adapter/api/app/AppMapper'
import { FetcherSpi } from '@adapter/spi/fetcher/FetcherSpi'
import { NativeFetcher } from '@infrastructure/fetcher/NativeFetcher'
import * as UI from '@infrastructure/ui'

import type { FoundationData } from '@infrastructure/server/ExpressServer/server'

declare global {
  interface Window {
    __FOUNDATION_DATA__: FoundationData
    rootPage: Root
  }
  interface NodeModule {
    hot: {
      accept: () => void
    }
  }
}

function getUI(uiName: string) {
  switch (uiName) {
    case 'TailwindUI':
      return UI.TailwindUI
    default:
      return UI.UnstyledUI
  }
}

;(async () => {
  const { page: pageDto, tables, params, adapters, development } = window.__FOUNDATION_DATA__
  const app = AppMapper.toEntity({ pages: [pageDto], tables }, { ui: getUI(adapters.uiName) })
  const page = app.getPageByPath(pageDto.path)
  const fetcherAdapter = new NativeFetcher(window.location.origin)
  const fetcherSpi = new FetcherSpi(fetcherAdapter, app)
  const pageController = new PageController(app, fetcherSpi)
  const Page = await pageController.render(page, params)
  const container = document.getElementById('root')
  if (!container) throw new Error('Root element not found')
  if (!development) {
    hydrateRoot(container, <Page />)
  } else {
    if (module.hot) {
      module.hot.accept()
    }
    if (!window.rootPage) {
      window.rootPage = hydrateRoot(container, <Page />)
    } else {
      window.rootPage.render(<Page />)
    }
  }
})()