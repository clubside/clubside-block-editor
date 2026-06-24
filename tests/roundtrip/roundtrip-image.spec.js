import { test, expect } from '@playwright/test'

test.describe('Roundtrip: Image Blocks', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/tests/0.1.0/index.html')
	})

	test('loads sample.json, edits around an image, deletes it, and roundtrips cleanly', async ({ page }) => {
		// Load the sample document
		await page.click('#load')
		await page.waitForSelector('.csbe-block')

		// Capture initial state
		const initial = await page.evaluate(() => window.csbe.save())

		// Ensure at least one image block exists
		expect(initial.blocks.some(b => b.type === 'image')).toBe(true)

		// --- Edit BEFORE the image ---
		await page.evaluate(() => {
			const editor = document.querySelector('.csbe-editor')
			const blocks = editor.children
			const first = blocks[0] // guaranteed paragraph

			const range = document.createRange()
			const sel = window.getSelection()

			range.selectNodeContents(first)
			range.collapse(false)

			sel.removeAllRanges()
			sel.addRange(range)
		})

		await page.keyboard.type(' BeforeImage')

		// --- Edit AFTER the image ---
		await page.evaluate(() => {
			const editor = document.querySelector('.csbe-editor')
			const blocks = Array.from(editor.children)
			const imgIndex = blocks.findIndex(el => el.tagName === 'IMG')
			const afterImg = blocks[imgIndex + 1]

			const range = document.createRange()
			const sel = window.getSelection()

			range.selectNodeContents(afterImg)
			range.collapse(true)

			sel.removeAllRanges()
			sel.addRange(range)
		})

		await page.keyboard.type(' AfterImage')

		// --- Delete the image block ---
		await page.evaluate(() => {
			const img = document.querySelector('img.csbe-image.csbe-block')
			if (img) img.remove()
		})

		// Save after edits
		const after = await page.evaluate(() => window.csbe.save())

		// Structural expectations
		expect(Array.isArray(after.blocks)).toBe(true)
		expect(after.blocks.length).toBe(initial.blocks.length - 1) // one image removed

		// Validate block invariants
		for (const block of after.blocks) {
			expect(block).toHaveProperty('type')
			expect(block).toHaveProperty('version')
			expect(block).toHaveProperty('meta')
			expect(block).toHaveProperty('content')
			expect(block).toHaveProperty('settings')
			expect(block.settings).toHaveProperty('uuid')
		}

		// Ensure no image blocks remain
		expect(after.blocks.some(b => b.type === 'image')).toBe(false)

		// Ensure no empty paragraphs
		const emptyParagraphs = after.blocks.filter(b =>
			b.type === 'paragraph' &&
            (!b.content || b.content.trim() === '')
		)
		expect(emptyParagraphs.length).toBe(0)

		// Roundtrip consistency
		const secondPass = await page.evaluate((doc) => {
			window.csbe.load(doc)
			return window.csbe.save()
		}, after)

		expect(after).toEqual(secondPass)
	})
})
