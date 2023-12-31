import { join } from 'path'
import fs from 'fs-extra'
import puppeteer from 'puppeteer'
import { v4 as uuidv4 } from 'uuid'
import { HtmlToPdfConverterDriver } from '@adapters/mappers/converter/IConverterDrivers'

export class PuppeteerHtmlToPdfConverter implements HtmlToPdfConverterDriver {
  constructor(readonly tmpFolder: string) {}

  async convert(html: string): Promise<Buffer> {
    const filePath = join(this.tmpFolder, uuidv4() + '.pdf')
    const browser = await puppeteer.launch({ headless: 'new' })
    const page = await browser.newPage()
    await page.setContent(html)
    await page.pdf({ path: filePath, format: 'A4' })
    await browser.close()
    const file = await fs.readFile(filePath)
    await fs.remove(filePath)
    return file
  }
}
