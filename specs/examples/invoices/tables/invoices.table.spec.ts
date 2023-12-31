import { test, expect, helpers } from '@test/e2e/fixtures'
import INVOICES_CONFIG from '@examples/invoices/config'

test.describe('An api that allow CRUD operations on invoices', () => {
  test('should create a list of invoices', async ({ request }) => {
    // GIVEN
    const app = await helpers.startApp(INVOICES_CONFIG)
    const { invoices } = helpers.generateRecordsDto(INVOICES_CONFIG, 'invoices', 2)

    // WHEN
    const res = await request.post(helpers.getUrl(app.port, '/api/table/invoices'), {
      data: invoices,
    })

    // THEN
    expect(res.status()).toEqual(200)
    const records = await app.drivers.database.list('invoices')
    expect(records.length).toEqual(2)
    for (let i = 0; i < records.length; i++) {
      expect(records[i].id).toBeDefined()
      expect(records[i].created_time).toBeDefined()
    }
  })

  test('should read a list of invoices from a list of ids', async ({ request }) => {
    // GIVEN
    // We provide 3 invoices and we get only 2 ids
    const app = await helpers.startApp(INVOICES_CONFIG)
    const { invoices } = await helpers.generateRecords(
      INVOICES_CONFIG,
      app.drivers.database,
      'invoices',
      3
    )
    const ids = invoices.map((i) => i.id)
    const filteredIds = ids.slice(0, 2)

    // WHEN
    // I make a GET request on table invoices
    const res = await request.get(
      helpers.getUrl(
        app.port,
        `/api/table/invoices?filter_field_0=id&filter_operator_0=is_any_of&filter_value_0=${filteredIds.join(
          ','
        )}`
      )
    )

    // THEN
    // I have read 2 invoices
    expect(res.status()).toEqual(200)
    const { records } = await res.json()
    expect(records.length).toEqual(2)
    expect(records[0].id).toEqual(ids[0])
    expect(records[1].id).toEqual(ids[1])
  })

  test('should update an invoice', async ({ request }) => {
    // GIVEN
    // We provide an invoice
    const app = await helpers.startApp(INVOICES_CONFIG)
    const {
      invoices: [{ id }],
    } = await helpers.generateRecords(INVOICES_CONFIG, app.drivers.database, 'invoices', [
      {
        customer: 'Customer A',
      },
    ])

    // WHEN
    // I make a PATCH request to update this invoice
    const update = {
      customer: 'Customer B',
    }
    const res = await request.patch(helpers.getUrl(app.port, `/api/table/invoices/${id}`), {
      data: update,
    })

    // THEN
    // The updated invocie should have a new name
    expect(res.status()).toEqual(200)
    const [updatedRecord] = await app.drivers.database.list('invoices')
    expect(updatedRecord.id).toEqual(id)
    expect(updatedRecord.customer).toEqual(update.customer)
    expect(updatedRecord.last_modified_time).toBeDefined()
  })

  test('should soft delete an invoice', async ({ request }) => {
    // GIVEN
    // We provide an invoice
    const app = await helpers.startApp(INVOICES_CONFIG)
    const {
      invoices: [{ id }],
    } = await helpers.generateRecords(INVOICES_CONFIG, app.drivers.database, 'invoices')

    // WHEN
    // I make a DELETE request to soft delete this invoice
    const res = await request.delete(helpers.getUrl(app.port, `/api/table/invoices/${id}`))

    // THEN
    // I should have a deleted_at value on my soft deleted invoice
    expect(res.status()).toEqual(200)
    const [deletedRecord] = await app.drivers.database.list('invoices')
    expect(deletedRecord.id).toEqual(id)
    expect(deletedRecord.deleted_time).toBeDefined()
  })

  test('should finalised an invoice', async ({ request }) => {
    // GIVEN
    const app = await helpers.startApp(INVOICES_CONFIG)
    const {
      invoices: [{ id }],
    } = await helpers.generateRecords(INVOICES_CONFIG, app.drivers.database, 'invoices', [
      {
        finalised_time: undefined,
        number: undefined,
        status: 'draft',
      },
    ])

    // WHEN
    const update = {
      status: 'finalised',
    }
    const res = await request.patch(helpers.getUrl(app.port, `/api/table/invoices/${id}`), {
      data: update,
    })

    // THEN
    expect(res.status()).toEqual(200)
    const [finalisedRecord] = await app.drivers.database.list('invoices')
    expect(finalisedRecord.id).toEqual(id)
    expect(finalisedRecord.finalised_time).toBeDefined()
    expect(finalisedRecord.number).toBeDefined()
    expect(finalisedRecord.status).toEqual(update.status)
  })

  test('an employee should not be able to update a finalised invoice', async ({ request }) => {
    // GIVEN
    const app = await helpers.startApp(INVOICES_CONFIG)
    const {
      invoices: [{ id }],
    } = await helpers.generateRecords(INVOICES_CONFIG, app.drivers.database, 'invoices', [
      {
        customer: 'Customer A',
        status: 'finalised',
        finalised_time: new Date().toISOString(),
        number: 1,
      },
    ])

    // WHEN
    const update = {
      customer: 'Customer B',
    }
    const res = await request.patch(helpers.getUrl(app.port, `/api/table/invoices/${id}`), {
      data: update,
    })

    // THEN
    expect(res.status()).toEqual(400)
    const { error } = await res.json()
    expect(error).toEqual('field "customer" cannot be updated')
    const [updatedRecord] = await app.drivers.database.list('invoices')
    expect(updatedRecord.customer).toEqual('Customer A')
  })

  test('an administrator should be able to update a finalised invoice', async ({ request }) => {
    // GIVEN
    const app = await helpers.startApp(INVOICES_CONFIG)
    const {
      invoices: [{ id }],
    } = await helpers.generateRecords(INVOICES_CONFIG, app.drivers.database, 'invoices', [
      {
        customer: 'Customer A',
        status: 'finalised',
        finalised_time: new Date().toISOString(),
        number: 1,
      },
    ])

    // WHEN
    const update = {
      customer: 'Customer B',
    }
    const res = await request.patch(helpers.getUrl(app.port, `/api/table/invoices/${id}`), {
      data: update,
      headers: { role: 'admin' },
    })

    // THEN
    expect(res.status()).toEqual(200)
    const [updatedRecord] = await app.drivers.database.list('invoices')
    expect(updatedRecord.customer).toEqual('Customer B')
  })
})

test.describe('An api that render error messages', () => {
  test('should return a 404 error when the table does not exist', async ({ request }) => {
    // GIVEN
    // We provide an app with tables
    const app = await helpers.startApp(INVOICES_CONFIG)

    // WHEN
    // I make a GET request on an unknown table
    const res = await request.get(helpers.getUrl(app.port, '/api/table/unknown'))

    // THEN
    // I should have a 404 error
    expect(res.status()).toEqual(404)
    expect(await res.text()).toContain('Cannot GET /api/table/unknown')
  })

  test('should return a 404 error when the row does not exist', async ({ request }) => {
    // GIVEN
    // We provide an app with tables
    const app = await helpers.startApp(INVOICES_CONFIG)

    // WHEN
    // I make a GET request on an unknown row
    const res = await request.get(helpers.getUrl(app.port, '/api/table/invoices/unknown'))

    // THEN
    // I should have a 404 error
    expect(res.status()).toEqual(404)
    expect((await res.json()).error).toEqual('record "unknown" does not exist in table "invoices"')
  })

  test('should return a 400 error when fields are required', async ({ request }) => {
    // GIVEN
    // We provide an app with tables
    const app = await helpers.startApp(INVOICES_CONFIG)

    // WHEN
    // I make a POST request with an invalid row
    const res = await request.post(helpers.getUrl(app.port, '/api/table/invoices'), {
      data: { customer: 'Essentiel' },
    })

    // THEN
    // I should have a 400 error
    expect(res.status()).toEqual(400)
    const { error } = await res.json()
    expect(error).toContain('field "address" is required')
  })

  test('should return a 400 error when a field is not valid', async ({ request }) => {
    // GIVEN
    // We provide an app with tables
    const app = await helpers.startApp(INVOICES_CONFIG)
    const {
      invoices: [invoice],
    } = helpers.generateRecordsDto(INVOICES_CONFIG, 'invoices')
    invoice.invalid = 'invalid'

    // WHEN
    // I make a POST request with an invalid row
    const res = await request.post(helpers.getUrl(app.port, '/api/table/invoices'), {
      data: invoice,
    })

    // THEN
    // I should have a 400 error
    expect(res.status()).toEqual(400)
    const { error } = await res.json()
    expect(error).toContain('field "invalid" does not exist')
  })

  test('should return a 400 error when a record of a multiple linked field is not valid', async ({
    request,
  }) => {
    // GIVEN
    // We provide an app with tables
    const app = await helpers.startApp(INVOICES_CONFIG)

    const {
      invoices_items: [item],
    } = helpers.generateRecordsDto(INVOICES_CONFIG, 'invoices', [
      {
        items: [
          {
            quantity: 'test',
          },
        ],
      },
    ])

    // WHEN
    // I make a POST request with an invalid row
    const res = await request.post(helpers.getUrl(app.port, '/api/table/invoices_items'), {
      data: item,
    })

    // THEN
    // I should have a 400 error
    expect(res.status()).toEqual(400)
    const { error } = await res.json()
    expect(error).toContain('field "quantity" must be a number')
  })
})
