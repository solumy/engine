import { test, expect, helpers } from '@test/e2e/fixtures'
import INVOICES_CONFIG from '@examples/invoices/config'

test.describe('A page that list invoices', () => {
  test('should load Tailwind CSS', async ({ page }) => {
    // GIVEN
    const app = await helpers.startApp(INVOICES_CONFIG, { ui: 'tailwind' })

    // WHEN
    // I go to the home page "/"
    await page.goto(helpers.getUrl(app.port, '/'))

    // THEN
    expect(await page.getAttribute('h1', 'class')).toContain('text-4xl')
  })

  test('should display a title', async ({ page }) => {
    // GIVEN
    const app = await helpers.startApp(INVOICES_CONFIG)

    // WHEN
    // I go to the home page "/"
    await page.goto(helpers.getUrl(app.port, '/'))

    // THEN
    // Check that I'm on the / page
    expect(await page.textContent('h1')).toContain('Toutes les factures')
  })

  test('should display a list of invoices grouped by status', async ({ page }) => {
    // GIVEN
    // We provide 8 example invoices
    const app = await helpers.startApp(INVOICES_CONFIG)
    const {
      invoices: [firstInvoice],
    } = await helpers.generateRecords(INVOICES_CONFIG, app.drivers.database, 'invoices', [
      {
        status: 'draft',
      },
      {
        status: 'draft',
      },
      {
        status: 'finalised',
      },
      {
        status: 'finalised',
      },
      {
        status: 'sent',
      },
      {
        status: 'sent',
      },
      {
        status: 'sent',
      },
      {
        status: 'paid',
      },
    ])

    // WHEN
    // I go to the home page "/" and invoices are loaded
    await page.goto(helpers.getUrl(app.port, '/'))
    await page.getByRole('cell', { name: String(firstInvoice.customer) }).waitFor()

    // THEN
    // Check that invoices are displayed in a group by status
    const invoices = await app.drivers.database.list('invoices')

    // Check the number of draft rows
    const draftRows = await page.getByRole('cell', { name: /^Brouillon$/ }).all()
    expect(draftRows.length).toBe(invoices.filter((i) => i.status === 'draft').length + 1)

    // Check the number of finalised rows
    const finalisedRows = await page.getByRole('cell', { name: /^Finalisée$/ }).all()
    expect(finalisedRows.length).toBe(invoices.filter((i) => i.status === 'finalised').length + 1)

    // Check the number of sent rows
    const sentRows = await page.getByRole('cell', { name: /^Envoyée$/ }).all()
    expect(sentRows.length).toBe(invoices.filter((i) => i.status === 'sent').length + 1)

    // Check the number of paid rows
    const paidRows = await page.getByRole('cell', { name: /^Payée$/ }).all()
    expect(paidRows.length).toBe(invoices.filter((i) => i.status === 'paid').length + 1)
  })

  test('should display a list of invoices sorted by dates in status groups', async ({ page }) => {
    // GIVEN
    // We provide 5 example invoices with finalised dates and status
    const app = await helpers.startApp(INVOICES_CONFIG)
    const {
      invoices: [firstInvoice],
    } = await helpers.generateRecords(INVOICES_CONFIG, app.drivers.database, 'invoices', [
      {
        finalised_time: new Date(2021, 3, 15).toISOString(),
        status: 'finalised',
        number: 1,
      },
      {
        finalised_time: new Date(2021, 4, 25).toISOString(),
        status: 'paid',
        number: 2,
      },
      {
        finalised_time: new Date(2021, 5, 4).toISOString(),
        status: 'sent',
        number: 3,
      },
      {
        finalised_time: new Date(2021, 4, 6).toISOString(),
        status: 'finalised',
        number: 4,
      },
      {
        finalised_time: new Date(2021, 4, 20).toISOString(),
        status: 'sent',
        number: 5,
      },
    ])

    // WHEN
    // I go to the home page "/" and invoices are loaded
    await page.goto(helpers.getUrl(app.port, '/'))
    await page.getByRole('cell', { name: String(firstInvoice.customer) }).waitFor()

    // THEN
    // Check that factures are sorted by finalised_date
    const invoices = await app.drivers.database.list('invoices')
    const rows = await page.getByRole('row').all()
    const ids = await Promise.all(rows.map((row) => row.getAttribute('id')))
    expect(ids.filter((i) => !!i)).toEqual([
      invoices.find((i) => i.number === 4)?.id,
      invoices.find((i) => i.number === 1)?.id,
      invoices.find((i) => i.number === 3)?.id,
      invoices.find((i) => i.number === 5)?.id,
      invoices.find((i) => i.number === 2)?.id,
    ])
  })

  test('should go to the /create page when clicking on the "Créer une facture" button', async ({
    page,
  }) => {
    // GIVEN
    const app = await helpers.startApp(INVOICES_CONFIG)

    // WHEN
    // I go to the home page "/"
    await page.goto(helpers.getUrl(app.port, '/'))

    // AND
    // I click on the "Créer une facture" button
    await page.click('text="Créer une facture"')
    await page.waitForURL(helpers.getUrl(app.port, '/create'))

    // THEN
    // Check that I'm on the /create page
    expect(await page.textContent('h1')).toContain('Créer une facture')
  })

  test('should display an invoice with calculated vat and total', async ({ page }) => {
    // GIVEN
    const app = await helpers.startApp(INVOICES_CONFIG)
    const {
      invoices: [invoice],
    } = await helpers.generateRecords(INVOICES_CONFIG, app.drivers.database, 'invoices', [
      {
        status: 'draft',
        items: [
          {
            quantity: 3,
            unit_price: 15,
            vat: 0.2,
          },
          {
            quantity: 2,
            unit_price: 10,
            vat: 0.2,
          },
        ],
      },
    ])

    // WHEN
    await page.goto(helpers.getUrl(app.port, '/'))
    await expect(page.getByRole('cell', { name: String(invoice.customer) })).toBeVisible()

    // THEN
    await expect(page.getByRole('cell', { name: /^65€$/i })).toBeVisible()
    await expect(page.getByRole('cell', { name: /^13€$/i })).toBeVisible()
    await expect(page.getByRole('cell', { name: /^78€$/i })).toBeVisible()
  })

  test('should display a button that open an invoice url', async ({ page }) => {
    // GIVEN
    const app = await helpers.startApp(INVOICES_CONFIG)
    const url = `http://localhost:${app.port}/create`
    await helpers.generateRecords(INVOICES_CONFIG, app.drivers.database, 'invoices', [
      {
        url,
      },
    ])

    // WHEN
    await page.goto(helpers.getUrl(app.port, '/'))
    const [newWindow] = await Promise.all([
      page.waitForEvent('popup'),
      page.getByRole('cell', { name: 'Ouvrir' }).click(),
    ])

    // THEN
    expect(await newWindow.title()).toBe('Factures')
  })
})
