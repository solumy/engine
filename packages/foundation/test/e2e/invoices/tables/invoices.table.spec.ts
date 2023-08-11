import { test, expect, helpers, Foundation } from '../../../utils/e2e/fixtures'
import { RecordDto } from '@adapter/api/app/dtos/RecordDto'

test.describe('An api that allow CRUD operations on invoices', () => {
  test('should create a list of invoices', async ({ request, url, orm, folder }) => {
    // GIVEN
    const port = 50501
    await new Foundation({ port, folder, adapters: { orm } })
      .config({
        tables: helpers.getTablesDto('invoices'),
      })
      .start()
    const { invoices } = helpers.generateRecordsDto('invoices', 2)

    // WHEN
    await request.post(url(port, '/api/table/invoices'), { data: invoices })

    // THEN
    const records = await orm.list('invoices')
    expect(records.length).toEqual(2)
    for (let i = 0; i < records.length; i++) {
      expect(records[i].id).toBeDefined()
      expect(records[i].created_time).toBeDefined()
    }
  })

  test('should read a list of invoices from a list of ids', async ({
    request,
    url,
    orm,
    folder,
  }) => {
    // GIVEN
    // We provide 3 invoices and we get only 2 ids
    const port = 50502
    await new Foundation({ port, folder, adapters: { orm } })
      .config({
        tables: helpers.getTablesDto('invoices'),
      })
      .start()
    const { invoices } = await helpers.generateRecords(orm, 'invoices', 3)
    const ids = invoices.map((i: RecordDto) => i.id)
    const filteredIds = ids.slice(0, 2)

    // WHEN
    // I make a GET request on table invoices
    const res = await request.get(
      url(
        port,
        `/api/table/invoices?filter_field_0=id&filter_operator_0=is_any_of&filter_value_0=${filteredIds.join(
          ','
        )}`
      )
    )

    // THEN
    // I have read 2 invoices
    const { records } = await res.json()
    expect(records.length).toEqual(2)
    expect(records[0].id).toEqual(ids[0])
    expect(records[1].id).toEqual(ids[1])
  })

  test('should update an invoice', async ({ request, url, orm, folder }) => {
    // GIVEN
    // We provide an invoice
    const port = 50503
    await new Foundation({ port, folder, adapters: { orm } })
      .config({
        tables: helpers.getTablesDto('invoices'),
      })
      .start()
    const {
      invoices: [{ id }],
    } = await helpers.generateRecords(orm, 'invoices', [
      {
        customer: 'Customer A',
      },
    ])

    // WHEN
    // I make a PATCH request to update this invoice
    const update = {
      customer: 'Customer B',
    }
    await request.patch(url(port, `/api/table/invoices/${id}`), {
      data: update,
    })

    // THEN
    // The updated invocie should have a new name
    const [updatedRecord] = await orm.list('invoices')
    expect(updatedRecord.id).toEqual(id)
    expect(updatedRecord.customer).toEqual(update.customer)
    expect(updatedRecord.last_modified_time).toBeDefined()
  })

  test('should soft delete an invoice', async ({ request, url, orm, folder }) => {
    // GIVEN
    // We provide an invoice
    const port = 50504
    await new Foundation({ port, folder, adapters: { orm } })
      .config({
        tables: helpers.getTablesDto('invoices'),
      })
      .start()
    const {
      invoices: [{ id }],
    } = await helpers.generateRecords(orm, 'invoices')

    // WHEN
    // I make a DELETE request to soft delete this invoice
    await request.delete(url(port, `/api/table/invoices/${id}`))

    // THEN
    // I should have a deleted_at value on my soft deleted invoice
    const [deletedRecord] = await orm.list('invoices')
    expect(deletedRecord.id).toEqual(id)
    expect(deletedRecord.deleted_time).toBeDefined()
  })

  test('should finalised an invoice', async ({ request, url, orm, folder }) => {
    // GIVEN
    const port = 50505
    await new Foundation({ port, folder, adapters: { orm } })
      .config({
        tables: helpers.getTablesDto('invoices'),
      })
      .start()
    const {
      invoices: [{ id }],
    } = await helpers.generateRecords(orm, 'invoices')

    // WHEN
    const update = {
      finalised_time: new Date().toISOString(),
      number: 1,
      status: 'finalised',
    }
    await request.patch(url(port, `/api/table/invoices/${id}`), {
      data: update,
    })

    // THEN
    const [finalisedRecord] = await orm.list('invoices')
    expect(finalisedRecord.id).toEqual(id)
    expect(finalisedRecord.finalised_time).toEqual(update.finalised_time)
    expect(finalisedRecord.number).toEqual(update.number)
    expect(finalisedRecord.status).toEqual(update.status)
  })

  test.skip('should not be able to update a finalised invoice', async ({
    request,
    url,
    orm,
    folder,
  }) => {
    // GIVEN
    const port = 50506
    await new Foundation({ port, folder, adapters: { orm } })
      .config({
        tables: helpers.getTablesDto('invoices'),
      })
      .start()
    const {
      invoices: [{ id }],
    } = await helpers.generateRecords(orm, 'invoices', [
      {
        customer: 'Customer A',
        status: 'finalised',
        finalised_time: new Date().toISOString(),
        number: 1,
      },
    ])

    // WHEN
    // TODO: implement this validation
    const update = {
      customer: 'Customer B',
    }
    const res = await request.patch(url(port, `/api/table/invoices/${id}`), {
      data: update,
    })

    // THEN
    expect(res.status()).toEqual(400)
    const { error } = await res.json()
    expect(error).toEqual('field "customer" cannot be updated')
    const [updatedRecord] = await orm.list('invoices')
    expect(updatedRecord.id).toEqual(id)
    expect(updatedRecord.customer).toEqual('Customer A')
    expect(updatedRecord.number).toEqual(1)
  })
})

test.describe('An api that render error messages', () => {
  test('should return a 404 error when the table does not exist', async ({
    request,
    url,
    orm,
    folder,
  }) => {
    // GIVEN
    // We provide an app with tables
    const port = 50507
    await new Foundation({ port, folder, adapters: { orm } })
      .config({
        tables: helpers.getTablesDto('invoices'),
      })
      .start()

    // WHEN
    // I make a GET request on an unknown table
    const res = await request.get(url(port, '/api/table/unknown'))

    // THEN
    // I should have a 404 error
    expect(res.status()).toEqual(404)
    expect((await res.json()).error).toEqual('table "unknown" does not exist')
  })

  test('should return a 404 error when the row does not exist', async ({
    request,
    url,
    orm,
    folder,
  }) => {
    // GIVEN
    // We provide an app with tables
    const port = 50508
    await new Foundation({ port, folder, adapters: { orm } })
      .config({
        tables: helpers.getTablesDto('invoices'),
      })
      .start()

    // WHEN
    // I make a GET request on an unknown row
    const res = await request.get(url(port, '/api/table/invoices/unknown'))

    // THEN
    // I should have a 404 error
    expect(res.status()).toEqual(404)
    expect((await res.json()).error).toEqual('record "unknown" does not exist in table "invoices"')
  })

  test('should return a 400 error when fields are required', async ({
    request,
    url,
    orm,
    folder,
  }) => {
    // GIVEN
    // We provide an app with tables
    const port = 50509
    await new Foundation({ port, folder, adapters: { orm } })
      .config({
        tables: helpers.getTablesDto('invoices'),
      })
      .start()

    // WHEN
    // I make a POST request with an invalid row
    const res = await request.post(url(port, '/api/table/invoices'), {
      data: { customer: 'Essentiel' },
    })

    // THEN
    // I should have a 400 error
    expect(res.status()).toEqual(400)
    const { error } = await res.json()
    expect(error).toContain('field "address" is required')
  })

  test('should return a 400 error when a field is not valid', async ({
    request,
    url,
    folder,
    orm,
  }) => {
    // GIVEN
    // We provide an app with tables
    const port = 50510
    await new Foundation({ port, folder, adapters: { orm } })
      .config({
        tables: helpers.getTablesDto('invoices'),
      })
      .start()
    const {
      invoices: [invoice],
    } = helpers.generateRecordsDto('invoices')
    invoice.invalid = 'invalid'

    // WHEN
    // I make a POST request with an invalid row
    const res = await request.post(url(port, '/api/table/invoices'), { data: invoice })

    // THEN
    // I should have a 400 error
    expect(res.status()).toEqual(400)
    const { error } = await res.json()
    expect(error).toContain('field "invalid" does not exist')
  })

  test('should return a 400 error when a record of a multiple linked field is not valid', async ({
    request,
    url,
    folder,
    orm,
  }) => {
    // GIVEN
    // We provide an app with tables
    const port = 50511
    await new Foundation({ port, folder, adapters: { orm } })
      .config({
        tables: helpers.getTablesDto('invoices'),
      })
      .start()
    const {
      invoices_items: [item],
    } = helpers.generateRecordsDto('invoices', [
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
    const res = await request.post(url(port, '/api/table/invoices_items'), { data: item })

    // THEN
    // I should have a 400 error
    expect(res.status()).toEqual(400)
    const { error } = await res.json()
    expect(error).toContain('field "quantity" must be a number')
  })
})