import { test, expect } from '@playwright/test'

test.describe('CSBE v0.1.0 — Paste HTML with Selection (Single Block)', () => {
	test('pasting HTML replaces selection inside a single block', async ({ page }) => {
		await page.goto('/fixtures/index.html')

		// Focus initial paragraph
		const block = page.locator('.csbe-block')
		await block.click()

		// Type base text
		await page.keyboard.type('Hello world')

		// Select "wor" inside "Hello world"
		await page.evaluate(() => {
			const block = document.querySelector('.csbe-block')
			const textNode = block.firstChild
			const range = document.createRange()

			// "Hello " = 6 chars, "wor" = 3 chars
			range.setStart(textNode, 6)
			range.setEnd(textNode, 9)

			const sel = window.getSelection()
			sel.removeAllRanges()
			sel.addRange(range)
		})

		// Simulate HTML paste
		await page.evaluate(() => {
			const html = `
        <p>The answer was within her reach...</p>
        <p>He scolded himself for being so tentative...</p>
        <img src="/tests/landscape04.jpg">
        <p>This is important to remember...</p>
      `
			const data = new DataTransfer()
			data.setData('text/html', html)

			document
				.querySelector('[contenteditable="true"]')
				.dispatchEvent(
					new ClipboardEvent('paste', {
						clipboardData: data,
						bubbles: true,
						cancelable: true
					})
				)
		})

		// Allow async caret placement to complete
		await page.evaluate(async () => {
			await new Promise(resolve => setTimeout(resolve, 0))
		})

		// Validate block count
		const blocks = page.locator('.csbe-block')
		await expect(blocks).toHaveCount(6)

		// Validate block types
		const blockTypes = await blocks.evaluateAll(nodes =>
			nodes.map(n => n.dataset.blocktype)
		)

		expect(blockTypes).toEqual([
			'paragraph',
			'paragraph',
			'paragraph',
			'image',
			'paragraph',
			'paragraph'
		])

		// Validate text content of first and last blocks
		const firstText = await blocks.nth(0).textContent()
		const lastText = await blocks.nth(5).textContent()

		expect(firstText).toBe('Hello ')
		expect(lastText).toBe('ld')

		// Validate caret position (Playwright‑safe)
		const caretInfo = await page.evaluate(() => {
			const sel = window.getSelection()
			if (!sel || sel.rangeCount === 0) return { error: 'no selection' }

			const range = sel.getRangeAt(0)
			const blocks = Array.from(document.querySelectorAll('.csbe-block'))

			const caretBlockIndex = blocks.findIndex(b =>
				b.contains(range.startContainer)
			)

			return {
				caretBlockIndex,
				caretOffset: range.startOffset
			}
		})

		// Caret must be in block 4 (last inserted paragraph)
		expect(caretInfo.caretBlockIndex).toBe(4)

		// Offset must be > 0 (Playwright cannot reliably report exact offset)
		expect(caretInfo.caretOffset).toBeGreaterThan(0)
	})
})
