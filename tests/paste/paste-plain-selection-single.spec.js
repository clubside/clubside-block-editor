import { test, expect } from '@playwright/test'

test.describe('CSBE v0.1.0 — Paste: Plain Text Selection (Single Block)', () => {
	test('pasting plain text over a selection inside one block replaces the selection without creating new blocks', async ({ page }) => {
		await page.goto('/fixtures/index.html')

		// Focus the initial paragraph
		const block = page.locator('.csbe-block')
		await block.click()

		// Type base text
		await page.keyboard.type('Hello world')

		// Select "world" (characters 6–11)
		await page.evaluate(() => {
			const block = document.querySelector('.csbe-block')
			const textNode = block.firstChild

			const range = document.createRange()
			range.setStart(textNode, 6) // after "Hello "
			range.setEnd(textNode, 11) // end of "world"

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

		// Text should be: "Hello beautiful "
		const text = await blocks.first().textContent()
		expect(text).toBe('Hello beautiful ')

		// Caret should be after "beautiful "
		const caretCorrect = await page.evaluate(() => {
			const sel = window.getSelection()
			if (!sel || sel.rangeCount === 0) return false
			const range = sel.getRangeAt(0)

			const block = document.querySelector('.csbe-block')
			if (!block.contains(range.startContainer)) return false

			// Find the text node containing the inserted text
			const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT)
			const nodes = []
			while (walker.nextNode()) nodes.push(walker.currentNode)

			const targetNode = nodes.find(n => n.textContent.includes('beautiful '))
			if (!targetNode) return false

			const endOfInserted =
    targetNode.textContent.indexOf('beautiful ') + 'beautiful '.length

			// Case 1: caret is inside the text node at the end of "beautiful "
			const insideText =
    range.startContainer === targetNode &&
    range.startOffset === endOfInserted

			// Case 2: caret is after the text node in the block (setStartAfter behavior)
			const childIndex = Array.prototype.indexOf.call(block.childNodes, targetNode)
			const afterNode =
    range.startContainer === block &&
    range.startOffset === childIndex + 1

			return insideText || afterNode
		})

		expect(caretCorrect).toBe(true)
	})
})
