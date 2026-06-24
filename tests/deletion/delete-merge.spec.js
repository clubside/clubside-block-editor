import { test, expect } from '@playwright/test'

test.describe('CSBE v0.1.0 — Delete Block Merge', () => {
	test('Delete at end of a block merges it with the next block', async ({ page }) => {
		await page.goto('/fixtures/index.html')

		// Focus the initial paragraph
		const block = page.locator('.csbe-block')
		await block.click()

		// Type text into the first block
		await page.keyboard.type('Hello world')

		// Split the block
		await page.keyboard.press('Enter')

		// There should now be 2 blocks
		let blocks = page.locator('.csbe-block')
		await expect(blocks).toHaveCount(2)

		// Type text into the second block so we can verify merge position
		await page.keyboard.type('Second')

		// Move caret to end of first block
		await page.evaluate(() => {
			const first = document.querySelectorAll('.csbe-block')[0]
			const walker = document.createTreeWalker(first, NodeFilter.SHOW_TEXT)
			let lastText = null
			while (walker.nextNode()) lastText = walker.currentNode
			if (!lastText) return
			const range = document.createRange()
			range.setStart(lastText, lastText.textContent.length)
			range.collapse(true)
			const sel = window.getSelection()
			sel.removeAllRanges()
			sel.addRange(range)
		})

		// Press Delete to merge forward
		await page.keyboard.press('Delete')

		// Blocks should merge back into one
		blocks = page.locator('.csbe-block')
		await expect(blocks).toHaveCount(1)

		// The merged block should contain both pieces of text
		await expect(blocks.first()).toHaveText('Hello world Second')

		// Caret should now be at the boundary between the two original blocks
		const caretCorrect = await page.evaluate(() => {
			const sel = window.getSelection()
			if (!sel || sel.rangeCount === 0) return false
			const range = sel.getRangeAt(0)

			const expectedOffset = 'Hello world'.length

			return range.startContainer.nodeType === Node.TEXT_NODE && range.startOffset === expectedOffset
		})

		expect(caretCorrect).toBe(true)
	})
})
