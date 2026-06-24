import { test, expect } from '@playwright/test'

test.describe('CSBE v0.1.0 — Editor Initialization', () => {
	test('loads with exactly one empty paragraph block', async ({ page }) => {
		// Load the fixture page
		await page.goto('/fixtures/index.html')

		// Wait for CSBE to initialize
		await page.waitForSelector('.csbe-block')

		// Query all blocks
		const blocks = page.locator('.csbe-block')
		await expect(blocks).toHaveCount(1)

		// Validate block type
		const first = blocks.first()
		await expect(first).toHaveAttribute('data-blocktype', 'paragraph')

		// Validate block is empty
		const text = await first.textContent()
		expect(text.trim()).toBe('')

		// Validate caret is inside the paragraph
		const caretInside = await page.evaluate(() => {
			const sel = window.getSelection()
			if (!sel || sel.rangeCount === 0) return false
			const range = sel.getRangeAt(0)
			const block = document.querySelector('.csbe-block')
			return block.contains(range.startContainer)
		})

		expect(caretInside).toBe(true)
	})
})
