import { test, expect } from '@playwright/test'

test.describe('CSBE v0.1.0 — Typing: Split in Middle', () => {
	test('pressing Enter in the middle of text splits the block correctly', async ({ page }) => {
		await page.goto('/fixtures/index.html')

		// Focus the initial paragraph
		const block = page.locator('.csbe-block')
		await block.click()

		// Type text
		await page.keyboard.type('Hello world')

		// Move caret to between "Hello " and "world"
		await page.evaluate(() => {
			const block = document.querySelector('.csbe-block')
			const textNode = block.firstChild
			const range = document.createRange()

			// "Hello " is 6 characters
			range.setStart(textNode, 6)
			range.collapse(true)

			const sel = window.getSelection()
			sel.removeAllRanges()
			sel.addRange(range)
		})

		// Press Enter to split
		await page.keyboard.press('Enter')

		// There should now be 2 blocks
		const blocks = page.locator('.csbe-block')
		await expect(blocks).toHaveCount(2)

		// First block should contain "Hello "
		const firstText = await blocks.nth(0).innerHTML()
		expect(firstText).toBe('Hello ')

		// Second block should contain "world"
		const secondText = await blocks.nth(1).innerHTML()
		expect(secondText).toBe('world')

		// Caret should be at the start of the second block
		const caretCorrect = await page.evaluate(() => {
			const sel = window.getSelection()
			if (!sel || sel.rangeCount === 0) return false
			const range = sel.getRangeAt(0)

			const second = document.querySelectorAll('.csbe-block')[1]

			// Caret must be inside the second block
			if (!second.contains(range.startContainer)) return false

			// And at offset 0 within its current text node
			return range.startOffset === 0
		})

		expect(caretCorrect).toBe(true)
	})
})
