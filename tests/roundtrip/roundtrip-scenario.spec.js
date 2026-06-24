import { test, expect } from '@playwright/test'

test.describe('Roundtrip: Scenario Workflow', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/tests/0.1.0/index.html')
	})

	test('performs a realistic multi-step editing workflow and roundtrips cleanly', async ({ page }) => {
		// Load the sample document
		await page.click('#load')
		await page.waitForSelector('.csbe-block')

		// Capture initial document
		const initial = await page.evaluate(() => window.csbe.save())

		// --- Step 1: Type at end of first block ---
		await page.evaluate(() => {
			const first = document.querySelector('.csbe-block')
			const range = document.createRange()
			const sel = window.getSelection()

			range.selectNodeContents(first)
			range.collapse(false)
			sel.removeAllRanges()
			sel.addRange(range)
		})

		await page.keyboard.type(' Scenario')

		// --- Step 2: Press Enter to split the block ---
		await page.keyboard.press('Enter')

		// --- Step 3: Type into the new block ---
		await page.keyboard.type('New block text')

		// --- Step 4: Backspace at start of new block (merge back) ---
		await page.keyboard.press('Backspace')

		// --- Step 5: Move caret left twice ---
		await page.keyboard.press('ArrowLeft')
		await page.keyboard.press('ArrowLeft')

		// --- Step 6: Type in the middle of text ---
		await page.keyboard.type('X')

		// --- Step 7: Select a few characters and delete ---
		await page.keyboard.down('Shift')
		await page.keyboard.press('ArrowLeft')
		await page.keyboard.press('ArrowLeft')
		await page.keyboard.up('Shift')

		await page.keyboard.press('Delete')

		// Save after edits
		const after = await page.evaluate(() => window.csbe.save())

		// Structural expectations
		expect(Array.isArray(after.blocks)).toBe(true)
		expect(after.blocks.length).toBeGreaterThanOrEqual(initial.blocks.length)

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
		expect(emptyParagraphs.length).toBe(0)

		// Roundtrip consistency
		const secondPass = await page.evaluate((doc) => {
			window.csbe.load(doc)
			return window.csbe.save()
		}, after)

		expect(after).toEqual(secondPass)
	})
})
