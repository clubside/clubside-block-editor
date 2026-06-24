import { test, expect } from '@playwright/test'

test.describe('Roundtrip: Paste → Edit → Save', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/tests/0.1.0/index.html')
	})

	test('pastes HTML, edits inside it, deletes part, and roundtrips cleanly', async ({ page }) => {
		// Load the sample document
		await page.click('#load')
		await page.waitForSelector('.csbe-block')

		// Capture initial document
		const initial = await page.evaluate(() => window.csbe.save())

		// --- Step 1: Place caret at end of first block ---
		await page.evaluate(() => {
			const first = document.querySelector('.csbe-block')
			const range = document.createRange()
			const sel = window.getSelection()

			range.selectNodeContents(first)
			range.collapse(false)
			sel.removeAllRanges()
			sel.addRange(range)
		})

		// --- Step 2: Populate clipboard with HTML ---
		await page.evaluate(() => {
			const html = `
        <p>Pasted paragraph one.</p>
        <p>Pasted paragraph two.</p>
    `

			const data = new DataTransfer()
			data.setData('text/html', html)

			document.querySelector('.csbe-editor')
				.dispatchEvent(new ClipboardEvent('paste', {
					clipboardData: data,
					bubbles: true,
					cancelable: true
				}))
		})

		// --- Step 4: Edit inside the pasted content ---
		await page.evaluate(() => {
			const blocks = Array.from(document.querySelectorAll('.csbe-block'))
			const lastPasted = blocks[1] // first pasted paragraph becomes block index 1

			const range = document.createRange()
			const sel = window.getSelection()

			range.selectNodeContents(lastPasted)
			range.collapse(true)
			sel.removeAllRanges()
			sel.addRange(range)
		})

		await page.keyboard.type('EDIT-')

		// --- Step 5: Delete part of the pasted content ---
		await page.keyboard.down('Shift')
		await page.keyboard.press('ArrowRight')
		await page.keyboard.press('ArrowRight')
		await page.keyboard.up('Shift')

		await page.keyboard.press('Delete')

		// Save after edits
		const after = await page.evaluate(() => window.csbe.save())

		// Structural expectations
		expect(Array.isArray(after.blocks)).toBe(true)
		expect(after.blocks.length).toBeGreaterThan(initial.blocks.length)

		// Validate block invariants
		for (const block of after.blocks) {
			expect(block).toHaveProperty('type')
			expect(block).toHaveProperty('version')
			expect(block).toHaveProperty('meta')
			expect(block).toHaveProperty('content')
			expect(block).toHaveProperty('settings')
			expect(block.settings).toHaveProperty('uuid')
		}

		// Ensure no empty phantom paragraphs
		const emptyParagraphs = after.blocks.filter(b =>
			b.type === 'paragraph' &&
            (!b.content || b.content.trim() === '')
		)
		expect(emptyParagraphs.length).toBeLessThanOrEqual(1)

		// Roundtrip consistency
		const secondPass = await page.evaluate((doc) => {
			window.csbe.load(doc)
			return window.csbe.save()
		}, after)

		expect(after).toEqual(secondPass)
	})
})
