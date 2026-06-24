import { test, expect } from '@playwright/test'

test.describe('CSBE v0.1.0 — Typing & Block Splitting', () => {
	test('pressing Enter splits a paragraph block', async ({ page }) => {
		await page.goto('/fixtures/index.html')

		// Focus the initial paragraph
		const block = page.locator('.csbe-block')
		await block.click()

		// Type some text
		await page.keyboard.type('Hello world')

		// Press Enter to split
		await page.keyboard.press('Enter')

		// There should now be 2 blocks
		const blocks = page.locator('.csbe-block')
		await expect(blocks).toHaveCount(2)

		// First block should contain the text
		await expect(blocks.nth(0)).toHaveText('Hello world')

		// Second block should be empty
		const secondText = await blocks.nth(1).textContent()
		expect(secondText.trim()).toBe('')

		// Caret should be inside the second block
		const caretInsideSecond = await page.evaluate(() => {
			const sel = window.getSelection()
			if (!sel || sel.rangeCount === 0) return false
			const range = sel.getRangeAt(0)
			const second = document.querySelectorAll('.csbe-block')[1]
			return second.contains(range.startContainer)
		})

		expect(caretInsideSecond).toBe(true)
	})
})
