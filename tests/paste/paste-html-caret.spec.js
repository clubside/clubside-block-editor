import { test, expect } from '@playwright/test'

test.describe('CSBE v0.1.0 — Paste HTML at Caret', () => {
	test('pasting HTML at a collapsed caret splits the block and inserts valid clipboard blocks', async ({ page }) => {
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

			range.setStart(textNode, 6) // after "Hello "
			range.collapse(true)

			const sel = window.getSelection()
			sel.removeAllRanges()
			sel.addRange(range)
		})

		// Simulate HTML paste using your test suite HTML
		await page.evaluate(() => {
			const html = `
        <p>The answer was within her reach...</p>
        <p>He scolded himself for being so tentative...</p>
        <img src="/tests/landscape04.jpg">
        <p>This is important to remember...</p>
      `

			const data = new DataTransfer()
			data.setData('text/html', html)

			document.querySelector('.csbe-block').dispatchEvent(
				new ClipboardEvent('paste', {
					clipboardData: data,
					bubbles: true,
					cancelable: true
				})
			)
		})

		// After paste, we expect:
		// Block 0: "Hello "
		// Block 1: <p>The answer...</p>
		// Block 2: <p>He scolded...</p>
		// Block 3: <img>
		// Block 4: <p>This is important...</p>
		// Block 5: "world"

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

		// Validate first and last text blocks
		const firstText = await blocks.nth(0).textContent()
		const lastText = await blocks.nth(5).textContent()

		expect(firstText).toBe('Hello ')
		expect(lastText).toBe('world')

		// Find the image block dynamically
		const imgBlockIndex = await blocks.evaluateAll(nodes =>
			nodes.findIndex(n => n.dataset.blocktype === 'image')
		)

		expect(imgBlockIndex).toBeGreaterThan(-1)

		// The block itself *is* the <img>
		const imgBlock = blocks.nth(imgBlockIndex)

		// Assert the src on the block itself
		await expect(imgBlock).toHaveAttribute('src', /landscape04\.jpg$/)

		await page.evaluate(async () => {
			await new Promise(resolve => setTimeout(resolve, 0))
		})

		// Caret should be after the last inserted block (block 4)
		// If last inserted block is an image, remove selection and focus image
		const caretInfo = await page.evaluate(() => {
			const sel = window.getSelection()
			if (!sel || sel.rangeCount === 0) {
				return { error: 'no selection', caretInside: null }
			}

			const range = sel.getRangeAt(0)
			const blocks = Array.from(document.querySelectorAll('.csbe-block'))

			const caretBlockIndex = blocks.findIndex(b => b.contains(range.startContainer))

			// Compute last inserted block dynamically
			const lastInsertedIndex = blocks.length - 2
			const lastInserted = blocks[lastInsertedIndex]

			// Find last text node inside lastInserted
			let lastText = null
			if (lastInserted) {
				const walker = document.createTreeWalker(lastInserted, NodeFilter.SHOW_TEXT)
				while (walker.nextNode()) lastText = walker.currentNode
			}

			return {
				caretBlockIndex,
				caretOffset: range.startOffset,
				caretNodeText: range.startContainer?.textContent || null,
				lastInsertedIndex,
				lastInsertedType: lastInserted?.dataset?.blocktype || null,
				lastInsertedText: lastInserted?.textContent || null,
				lastTextNodeText: lastText?.textContent || null,
				lastTextNodeLength: lastText?.textContent?.length || null
			}
		})

		// console.log(caretInfo) // <-- Playwright prints this in the error context file

		expect(caretInfo.caretBlockIndex).toBe(caretInfo.lastInsertedIndex)
		// Just sanity check it's not at the very start
		expect(caretInfo.caretOffset).toBeGreaterThan(0)
	})
})
