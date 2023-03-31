import fs from 'fs-extra'
import { join } from 'path'

import { DatabaseSetup } from '../src'

test('should setup the database from config', async () => {
  fs.writeFileSync(join(__dirname, '../src/scripts/data/schema.cache.json'), '')
  try {
    await DatabaseSetup()
  } catch (error) {
    expect(error).toBeUndefined()
  }
})

test('should setup the database from cache', async () => {
  try {
    await DatabaseSetup()
  } catch (error) {
    expect(error).toBeUndefined()
  }
})
