import { AppDto } from '@adapter/api/app/dtos/AppDto'
import { test, expect, helpers, Foundation } from '../../../utils/e2e/fixtures'
import { getDedicatedTmpFolder } from '../../../utils/helpers/tmp'

test.describe('An automation that build an invoice document from a template', () => {
  test('should throw an error if the automation config is invalid', async () => {
    // GIVEN
    const config: AppDto = {
      tables: helpers.getTablesDto('invoices'),
      automations: [
        {
          name: 'build-invoice',
          trigger: {
            event: 'record_created',
            table: 'invoices',
          },
          actions: [
            {
              type: 'update_record',
              fields: {
                fieldX: 'test',
              },
              table: 'invalid',
            },
          ],
        },
      ],
    }

    // WHEN
    const call = () => new Foundation().config(config)

    // THEN
    expect(call).toThrow('table "invalid" in action "update_record" is not defined in tables')
  })

  test('should run the automation on startup', async () => {
    // GIVEN
    const config: AppDto = {
      tables: helpers.getTablesDto('invoices'),
      automations: [
        {
          name: 'log-on-startup',
          trigger: {
            event: 'server_started',
          },
          actions: [
            {
              type: 'log',
              message: 'App started',
            },
          ],
        },
      ],
    }
    const logs: string[] = []
    const log = (message: string) => logs.push(message)
    const folder = getDedicatedTmpFolder()
    const port = 50001
    const foundation = new Foundation({ adapters: { log }, folder, port })
    foundation.config(config)

    // WHEN
    await foundation.start()

    // THEN
    expect(logs).toContain('App started')
  })

  test('should run the automation when an invoice is created', async ({ request, url }) => {
    // GIVEN
    const config: AppDto = {
      tables: helpers.getTablesDto('invoices'),
      automations: [
        {
          name: 'build-invoice',
          trigger: {
            event: 'record_created',
            table: 'invoices',
          },
          actions: [
            {
              type: 'log',
              message: 'Invoice created',
            },
          ],
        },
      ],
    }
    const {
      invoices: [invoice],
    } = helpers.generateRecordsDto('invoices', 1)
    const logs: string[] = []
    const log = (message: string) => logs.push(message)
    const folder = getDedicatedTmpFolder()
    const port = 50002
    const foundation = new Foundation({ adapters: { log }, folder, port })
    await foundation.config(config).start()

    // WHEN
    await request.post(url(port, '/api/table/invoices'), { data: invoice })

    // THEN
    expect(logs).toContain('Invoice created')
  })

  test('should not run the action if the trigger did not happen', async () => {
    // GIVEN
    const config: AppDto = {
      tables: helpers.getTablesDto('invoices'),
      automations: [
        {
          name: 'build-invoice',
          trigger: {
            event: 'record_created',
            table: 'invoices',
          },
          actions: [
            {
              type: 'log',
              message: 'Invoice created',
            },
          ],
        },
      ],
    }
    const logs: string[] = []
    const log = (message: string) => logs.push(message)
    const folder = getDedicatedTmpFolder()
    const port = 50003
    const foundation = new Foundation({ adapters: { log }, folder, port })
    await foundation.config(config).start()

    // WHEN
    // We do nothing

    // THEN
    expect(logs).not.toContain('Invoice created')
  })
})