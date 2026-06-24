import { test, expect } from '@playwright/test'

test.describe('CSBE v0.1.0 — Paste: Plain Text at Caret', () => {
	test('pasting plain text at a collapsed caret inserts text without creating new blocks', async ({ page }) => {
		await page.goto('/fixtures/index.html')

		// Focus the initial paragraph
		const block = page.locator('.csbe-block')
		await block.click()

		// Type base text
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

		// Simulate paste of plain text
		await page.evaluate(() => {
			const data = new DataTransfer()
			data.setData('text/plain', 'beautiful ')

			document.querySelector('.csbe-block').dispatchEvent(
				new ClipboardEvent('paste', {
					clipboardData: data,
					bubbles: true,
					cancelable: true
				})
			)
		})

		// Only one block should exist
		const blocks = page.locator('.csbe-block')
		await expect(blocks).toHaveCount(1)

		// Text should be inserted in the middle
		const text = await blocks.first().textContent()
		expect(text).toBe('Hello beautiful world')

		// Caret should be after "beautiful "
		const caretCorrect = await page.evaluate(() => {
			const sel = window.getSelection()
			if (!sel || sel.rangeCount === 0) return false
			const range = sel.getRangeAt(0)

			const block = document.querySelector('.csbe-block')

			// Caret must be inside the block
			if (!block.contains(range.startContainer)) return false

			// Find the text node containing the inserted text
			const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT)
			const nodes = []
			while (walker.nextNode()) nodes.push(walker.currentNode)

			const targetNode = nodes.find(n => n.textContent.includes('beautiful '))
			if (!targetNode) return false

			const expectedOffset =
        targetNode.textContent.indexOf('beautiful ') + 'beautiful '.length

			return range.startContainer === targetNode &&
             range.startOffset === expectedOffset
		})

		expect(caretCorrect).toBe(true)
	})
})
