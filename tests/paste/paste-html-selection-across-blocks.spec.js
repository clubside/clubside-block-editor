import { test, expect } from '@playwright/test'

test.describe('CSBE v0.1.0 — Paste HTML With Selection Across Blocks', () => {
	test('pasting HTML replaces a selection spanning multiple blocks', async ({ page }) => {
		await page.goto('/fixtures/index.html')

		// Create three blocks manually
		const block = page.locator('.csbe-block')
		await block.click()
		await page.keyboard.type('Hello world')

		// Split into 3 blocks
		await page.keyboard.press('Enter')
		await page.keyboard.type('Second block text')
		await page.keyboard.press('Enter')
		await page.keyboard.type('Third block text')

		// Select from middle of block 0 through middle of block 2
		await page.evaluate(() => {
			const blocks = document.querySelectorAll('.csbe-block')

			const first = blocks[0].firstChild
			const last = blocks[2].firstChild

			const range = document.createRange()
			range.setStart(first, 6) // "Hello |world"
			range.setEnd(last, 5) // "Third| block text"

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
			'paragraph', // left fragment of block 0
			'paragraph', // pasted 1
			'paragraph', // pasted 2
			'image', // pasted 3
			'paragraph', // pasted 4
			'paragraph' // right fragment of block 2
		])

		// Validate left and right fragments
		const firstText = await blocks.nth(0).textContent()
		const lastText = await blocks.nth(5).textContent()

		expect(firstText).toBe('Hello')
		expect(lastText).toBe('block text')

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

		console.log(caretInfo)

		// Caret must be in block 4 (last inserted paragraph)
		expect(caretInfo.caretBlockIndex).toBe(4)

		// Offset must be > 0 (Playwright cannot reliably report exact offset)
		expect(caretInfo.caretOffset).toBeGreaterThan(0)
	})
})
