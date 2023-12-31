import React from 'react'
import { App } from '@entities/app/App'
import { Page } from '@entities/app/page/Page'
import { Context } from '@entities/app/page/context/Context'
import ReactDOMServer from 'react-dom/server'
import { IServerData } from '../server/IServerData'

export class PageController {
  constructor(private readonly app: App) {}

  async renderHtml(page: Page, context: Context): Promise<string> {
    try {
      const uiDriver = this.app.pages.ui.driverName
      const fetcherDriver = this.app.pages.fetcher.driverName
      const iconDriver = this.app.pages.icon.driverName
      const data: IServerData = {
        config: {
          pages: [page.params],
          tables: this.app.tables.getAllParams(),
        },
        params: context.path.params,
        drivers: {
          ui: uiDriver,
          fetcher: fetcherDriver,
          icon: iconDriver,
        },
        path: page.path,
      }
      const Page = await page.render(context)
      const html = ReactDOMServer.renderToString(<Page />)
      return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${page.title}</title>
          <script>
            window.__ENGINE_DATA__ = ${JSON.stringify(data)}
          </script>
          ${uiDriver !== 'unstyled' ? '<link href="/output.css" rel="stylesheet">' : ''}
        </head>
        <body>
          <div id="root">${html}</div>
          <script src="/client.js"></script>
        </body>
      </html>
    `
    } catch (e) {
      console.error(e)
      throw e
    }
  }
}
