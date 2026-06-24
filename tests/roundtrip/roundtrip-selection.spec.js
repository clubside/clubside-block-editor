import { test, expect } from '@playwright/test'

test.describe('Roundtrip: Selection Persistence (v0.1.0 behavior)', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/tests/0.1.0/index.html')
	})

	test('document roundtrips cleanly regardless of caret position', async ({ page }) => {
		// Load the sample document
		await page.click('#load')
		await page.waitForSelector('.csbe-block')

		// Save initial doc
		const before = await page.evaluate(() => window.csbe.save())

		// Reload
		await page.evaluate((doc) => window.csbe.load(doc), before)

		// Save again
		const after = await page.evaluate(() => window.csbe.save())

		// Roundtrip stability
		expect(after).toEqual(before)
	})
})
