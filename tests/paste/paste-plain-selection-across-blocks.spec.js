import { test, expect } from '@playwright/test'

test.describe('CSBE v0.1.0 — Paste: Plain Text Selection Across Blocks', () => {
	test('pasting plain text over a selection spanning multiple blocks merges into one block', async ({ page }) => {
		await page.goto('/fixtures/index.html')

		// Create two blocks:
		// Block 1: "Hello "
		// Block 2: "world"
		const first = page.locator('.csbe-block').first()
		await first.click()
		await page.keyboard.type('Hello ')
		await page.keyboard.press('Enter')
		await page.keyboard.type('world')

		const blocksBefore = page.locator('.csbe-block')
		await expect(blocksBefore).toHaveCount(2)

		// Select from inside block 1 to inside block 2
		await page.evaluate(() => {
			const blocks = document.querySelectorAll('.csbe-block')
			const block1 = blocks[0]
			const block2 = blocks[1]

			const text1 = block1.firstChild // "Hello "
			const text2 = block2.firstChild // "world"

			const range = document.createRange()
			range.setStart(text1, 3) // "Hel|lo "
			range.setEnd(text2, 2) // "wo|rld"

			const sel = window.getSelection()
			sel.removeAllRanges()
			sel.addRange(range)
		})

		// Paste plain text
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

		// After paste, only ONE block should remain
		const blocksAfter = page.locator('.csbe-block')
		await expect(blocksAfter).toHaveCount(1)

		// Expected final text:
		// "Hel" + "beautiful " + "rld"
		const finalText = await blocksAfter.first().textContent()
		expect(finalText).toBe('Helbeautiful rld')

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

			const expectedOffset =
        targetNode.textContent.indexOf('beautiful ') + 'beautiful '.length

			// Case 1: caret inside the text node at the correct offset
			const insideText =
        range.startContainer === targetNode &&
        range.startOffset === expectedOffset

			// Case 2: caret after the text node in the parent block
			const childIndex = Array.prototype.indexOf.call(block.childNodes, targetNode)
			const afterNode =
        range.startContainer === block &&
        range.startOffset === childIndex + 1

			return insideText || afterNode
		})

		expect(caretCorrect).toBe(true)
	})
})
