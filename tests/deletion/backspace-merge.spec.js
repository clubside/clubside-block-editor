import { test, expect } from '@playwright/test'

test.describe('CSBE v0.1.0 — Backspace Block Merge', () => {
	test('Backspace at start of a block merges it with the previous block', async ({ page }) => {
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

		// Ensure caret is in the second block
		const caretInSecond = await page.evaluate(() => {
			const sel = window.getSelection()
			if (!sel || sel.rangeCount === 0) return false
			const range = sel.getRangeAt(0)
			const second = document.querySelectorAll('.csbe-block')[1]
			return second.contains(range.startContainer)
		})
		expect(caretInSecond).toBe(true)

		// Press Backspace at the start of the second block
		await page.keyboard.press('Backspace')

		// Blocks should merge back into one
		blocks = page.locator('.csbe-block')
		await expect(blocks).toHaveCount(1)

		// The merged block should contain the original text
		await expect(blocks.first()).toHaveText('Hello world')

		// Caret should now be at the end of the merged block
		const caretAtEnd = await page.evaluate(() => {
			const sel = window.getSelection()
			if (!sel || sel.rangeCount === 0) return false
			const range = sel.getRangeAt(0)
			const block = document.querySelector('.csbe-block')
			const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT)
			let lastText = null
			while (walker.nextNode()) lastText = walker.currentNode
			if (!lastText) return false
			return range.startContainer === lastText &&
             range.startOffset === lastText.textContent.length
		})

		expect(caretAtEnd).toBe(true)
	})
})
