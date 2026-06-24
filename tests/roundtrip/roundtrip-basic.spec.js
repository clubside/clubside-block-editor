import { test, expect } from '@playwright/test'

test.describe('Roundtrip: JSON → DOM → JSON', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/tests/0.1.0/index.html')
	})

	test('loads sample.json, performs edits, and roundtrips cleanly', async ({ page }) => {
		// Load the sample document via the page's own load button
		await page.click('#load')

		// Wait for editor to initialize blocks
		await page.waitForSelector('.csbe-block')

		// Capture the initial JS object from save()
		const initial = await page.evaluate(() => window.csbe.save())

		// Perform a sequence of edits:
		// 1. Place caret at end of first block
		// 2. Type " test"
		// 3. Press Enter to split
		// 4. Type "More"
		await page.evaluate(() => {
			const first = document.querySelector('.csbe-block')
			const range = document.createRange()
			const sel = window.getSelection()

			range.selectNodeContents(first)
			range.collapse(false)

			sel.removeAllRanges()
			sel.addRange(range)
		})

		await page.keyboard.type(' test')
		await page.keyboard.press('Enter')
		await page.keyboard.type('More')

		// Save after edits
		const after = await page.evaluate(() => window.csbe.save())

		// Basic structural expectations
		expect(Array.isArray(after.blocks)).toBe(true)
		expect(after.blocks.length).toBeGreaterThan(initial.blocks.length)

		// Validate block invariants against your model
		for (const block of after.blocks) {
			expect(block).toHaveProperty('type')
			expect(block).toHaveProperty('version')
			expect(block).toHaveProperty('meta')
			expect(block).toHaveProperty('content')
			expect(block).toHaveProperty('settings')
			expect(block.settings).toHaveProperty('uuid')
		}

		// Ensure no empty phantom paragraph blocks
		const emptyBlocks = after.blocks.filter(b => {
			return b.type === 'paragraph' &&
                (!b.content || b.content.trim() === '')
		})
		expect(emptyBlocks.length).toBe(0)

		// Ensure roundtrip consistency:
		// Save → Load → Save should produce identical JS objects
		const secondPass = await page.evaluate((doc) => {
			window.csbe.load(doc)
			return window.csbe.save()
		}, after)

		expect(after).toEqual(secondPass)
	})
})
