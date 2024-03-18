import { test, expect } from '@utils/tests/fixtures'
import App, { type Config } from '@solumy/engine'

test.describe('App with pages', () => {
  test('should display a paragraph in app page', async ({ page }) => {
    // GIVEN
    const text = 'Hello world!'
    const config: Config = {
      name: 'App',
      features: [
        {
          name: 'display paragraph',
          pages: [
            {
              name: 'paragraph',
              path: '/',
              body: [
                {
                  component: 'Paragraph',
                  text,
                },
              ],
            },
          ],
        },
      ],
    }
    const app = new App()
    const url = await app.start(config)

    // WHEN
    await page.goto(url)
    const paragraphText = await page.textContent('p')

    // THEN
    expect(paragraphText).toBe(text)
  })
})