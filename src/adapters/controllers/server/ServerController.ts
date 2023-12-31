import { App } from '@entities/app/App'
import { IServerDriver } from './IServerDriver'
import { PageMiddleware } from '@adapters/middlewares/page/PageMiddleware'
import { TableMiddleware } from '@adapters/middlewares/table/TableMiddleware'
import { BucketMiddleware } from '@adapters/middlewares/bucket/BucketMiddleware'

export class ServerController {
  constructor(readonly driver: IServerDriver) {}

  async start(app: App): Promise<void> {
    if (app.pages.exist()) {
      const pageMiddleware = new PageMiddleware(app)
      for (const page of app.pages.getAll()) {
        this.driver.get(page.path, pageMiddleware.get(page))
      }
    }
    if (app.tables.exist()) {
      const tableMiddleware = new TableMiddleware(app)
      for (const table of app.tables.getAll()) {
        this.driver.post(`/api/sync/table`, tableMiddleware.sync())
        this.driver.get(`/api/table/${table.name}/:id`, tableMiddleware.getById(table))
        this.driver.patch(`/api/table/${table.name}/:id`, tableMiddleware.patchById(table))
        this.driver.delete(`/api/table/${table.name}/:id`, tableMiddleware.deleteById(table))
        this.driver.get(`/api/table/${table.name}`, tableMiddleware.get(table))
        this.driver.post(`/api/table/${table.name}`, tableMiddleware.post(table))
      }
    }
    if (app.buckets.exist()) {
      const bucketMiddleware = new BucketMiddleware(app)
      for (const bucket of app.buckets.getAll()) {
        this.driver.get(`/api/storage/${bucket.name}/:filename`, bucketMiddleware.get(bucket))
      }
    }
    await app.configure()
    return this.driver.start()
  }

  async stop(): Promise<void> {
    return this.driver.stop()
  }
}
