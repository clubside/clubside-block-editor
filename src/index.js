// /src/index.js (ESM)

import paragraph from './blocks/paragraph.js'
import image from './blocks/image.js'
import heading from './blocks/heading.js'

const allBlocks = { paragraph, image, heading }
let activeBlocks = {}

const version = '0.1.0'

/**
 * @typedef {Object} CSBEState
 * @property {HTMLElement} root - container element
 * @property {HTMLElement} editor - editor element
 * @property {Object} options
 * @property {String[]} pasteSupport
 */

/**
 * @typedef {Object} CSBEEditor
 * @property {Function} load - load a document from a JavaScript Array
 * @property {Function} renderDocument - render document as HTML
 * @property {Function} renderEditor - render active editor as HTML
 * @property {Function} save - save editor as JavaScript Array
 * @property {Function} destroy - destroy the instance
 */

/**
 * @typedef {Object} CSBEEditorRenderer
 * @property {Function} render - render document as HTML
 */

/** @type {CSBEState} */
const state = {
	root: null,
	editor: null,
	options: {},
	pasteSupport: []
}

/**
 * Create an instance of the Clubside Block Editor
 * @param {HTMLElement} root - host for editor
 * @param {Object} options - editor options
 * @returns {CSBEEditor}
 */
export default async function CSBE(root, options = {}) {
	// Validate root
	if (!(root instanceof HTMLElement)) {
		throw new Error(
			'CSBE: The first argument must be an HTMLElement. ' +
      'Example: CSBE(document.getElementById("csbe"))'
		)
	}

	state.root = root
	state.options = options

	await configureBlocksForMode(state.options.mode)
	setupEmptyEditor()
	createInitialBlock()
	bindEvents()

	return { load, renderDocument, renderEditor, save, destroy }
}

/**
 * Create an instance of the Clubside Block Editor Renderer
 * @returns {CSBEEditorRenderer}
 */
export async function CSBERenderer() {
	activeBlocks = {
		paragraph: await allBlocks.paragraph({}),
		image: await allBlocks.image({}),
		heading: await allBlocks.heading({})
	}
	return {
		render(host, doc) {
			if (!(host instanceof HTMLElement)) {
				throw new Error('CSBE: The first argument must be an HTMLElement. Example: csbe.render(document.getElementById("csbe"), doc)')
			}
			if (!Array.isArray(doc)) {
				throw new Error('CSBE: The second argument must be an JavaScript Array. Example: csbe.render(document.getElementById("csbe"), doc)')
			}

			host.innerHTML = ''

			try {
				for (const block of doc) {
					if (activeBlocks[block.type]) {
						const ele = activeBlocks[block.type].render(block)
						host.appendChild(ele)
					}
				}
			} catch (error) {
				console.error(error)
			}
		}
	}
}

/* ───────────────────────────────────────────── */

/**
 * Bind events to the editor instance
 */
function bindEvents() {
	if (!state.root) return

	state.editor.addEventListener('beforeinput', (e) => {
		console.log(e.inputType)

		switch (e.inputType) {
			case 'deleteContentBackward':
			case 'deleteContentForward':
			case 'deleteByCut': {
				const sel = window.getSelection()
				if (!sel.rangeCount) return

				const range = sel.getRangeAt(0)

				if (range.collapsed) {
					const block = getBlockAncestor(range.startContainer)
					if (!block) return

					if (e.inputType === 'deleteContentBackward' && atStartOfBlock(block, range)) {
						const prevBlock = block.previousSibling
						const prevBlockMerge = getBlockMergeSetting(prevBlock)
						if (prevBlock === null) {
							e.preventDefault()
						} else if (prevBlock && !prevBlockMerge) {
							e.preventDefault()
							prevBlock.remove()
						} else {
							e.preventDefault()
							mergeWithPrevious(block, prevBlock, range)
						}
					} else if (e.inputType === 'deleteContentForward' && atEndOfBlock(block, range)) {
						const nextBlock = block.nextSibling
						const nextBlockMerge = getBlockMergeSetting(nextBlock)
						console.log({ nextBlock, nextBlockMerge })
						if (nextBlock === null) {
							e.preventDefault()
						} else if (nextBlock && !nextBlockMerge) {
							e.preventDefault()
							nextBlock.remove()
						} else {
							e.preventDefault()
							mergeWithNext(block, nextBlock, range)
						}
					}
				} else {
					const startBlock = getBlockAncestor(range.startContainer)
					const endBlock = getBlockAncestor(range.endContainer)

					if (startBlock && endBlock && startBlock !== endBlock) {
						e.preventDefault()
						mergeBlocksAcrossSelection(range, startBlock, endBlock)
					}
				}

				break
			}
			case 'insertParagraph': {
				const sel = window.getSelection()
				if (!sel.rangeCount) return

				const range = sel.getRangeAt(0)
				if (!range.collapsed) return

				const block = getBlockAncestor(range.startContainer)
				if (!block) return

				e.preventDefault()

				handleEnter(block, range)

				break
			}
		}
	})

	state.editor.addEventListener('input', (e) => {
		const sel = window.getSelection()
		if (!sel.rangeCount) return

		const block = getBlockAncestor(sel.anchorNode)
		if (!block) return

		if (block.childNodes.length === 1 && block.firstChild.nodeName === 'BR') {
			block.innerHTML = ''
			placeCaretAtEnd(block)
		}
	})

	state.editor.addEventListener('keydown', async (e) => {
		const sel = window.getSelection()
		if (!sel.rangeCount) return

		const range = sel.getRangeAt(0)

		const block = getBlockAncestor(range.startContainer)

		// console.log(e.ctrlKey, e.shiftKey, e.key, active, active.classList.contains('csbe-image'))
		// Only handle deletion when an image block is focused
		if (!block) return

		if (e.ctrlKey && !block.classList.contains('csbe-image')) {
			if (e.shiftKey) {
				switch (e.key) {
					case 'S':
						e.preventDefault()
						handleInline(block, sel, range, 'strike')
						break
					case 'H':
						e.preventDefault()
						handleInline(block, sel, range, 'mark')
						break
				}
			} else {
				switch (e.key) {
					case 'e':
						e.preventDefault()
						handleInline(block, sel, range, 'code')
						break
					case ',':
						e.preventDefault()
						handleInline(block, sel, range, 'sub')
						break
					case '.':
						e.preventDefault()
						handleInline(block, sel, range, 'sup')
						break
				}
			}
		}
	})

	state.editor.addEventListener('keyup', (e) => {
		if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return

		if (document.activeElement.dataset.blocktype === 'image') {
			const block = document.activeElement
			if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
				const next = block.nextElementSibling
				if (next) {
					if (next.dataset.blocktype === 'image') {
						clearSelection()
						next.focus()
					} else {
						placeCaretAtStart(next)
					}
				}
			} else {
				const prev = block.previousElementSibling
				if (prev) {
					if (prev.dataset.blocktype === 'image') {
						clearSelection()
						prev.focus()
					} else {
						placeCaretAtEnd(prev)
					}
				}
			}
		} else {
			const sel = window.getSelection()
			if (!sel.rangeCount) return

			const range = sel.getRangeAt(0)
			const container = range.startContainer

			// Only care when collapsed and inside the editor root
			if (!range.collapsed || container !== state.editor) return

			const offset = range.startOffset

			// Candidate nodes
			const before = state.editor.childNodes[offset - 1]
			const after = state.editor.childNodes[offset]

			// console.log({ before, after })

			// Check both sides
			const target =
			(before && before.dataset.blocktype === 'image')
				? before
				: (after && after.dataset.blocktype === 'image')
						? after
						: null

			if (target) {
				target.focus()
			}
		}
	})

	state.editor.addEventListener('paste', async (e) => {
		e.preventDefault()
		/** @type {DataTransfer} */
		const clipboard = e.clipboardData || window.clipboardData
		const clipboardText = clipboard.getData('text/plain')
		const clipboardHTML = clipboard.getData('text/html')

		/** @type {Selection} */
		const sel = window.getSelection()
		if (!sel.rangeCount) return

		/** @type {Range} */
		const range = sel.getRangeAt(0)

		console.log({ range })

		if (clipboardHTML !== '') {
			const parser = new DOMParser()
			const doc = parser.parseFromString(clipboardHTML, 'text/html')
			console.log(doc)
			const body = doc.body
			if (range.collapsed) {
				const block = getBlockAncestor(range.startContainer)
				if (atStartOfBlock(block, range)) {
					handleHTMLPaste(block, body, 'before')
				} else if (atEndOfBlock(block, range)) {
					handleHTMLPaste(block, body, 'after')
				} else {
					hanldeHTMLPasteInMiddle(block, range, body)
				}
			} else {
				const startBlock = getBlockAncestor(range.startContainer)
				const endBlock = getBlockAncestor(range.endContainer)

				if (startBlock && endBlock && startBlock === endBlock) {
					handleHTMLPasteSelectionInsideSingleBlock(startBlock, range, body)
				} else {
					handleHTMLPasteSelectionAcrossBlocks(startBlock, endBlock, range, body)
				}
			}
		} else {
			if (range.collapsed) {
				const block = getBlockAncestor(range.startContainer)
				const textNode = document.createTextNode(clipboardText)
				range.insertNode(textNode)
				moveCaretAfterNode(sel, range, textNode)
				block.normalize()
			} else {
				const startBlock = getBlockAncestor(range.startContainer)
				const endBlock = getBlockAncestor(range.endContainer)

				range.deleteContents()

				const textNode = document.createTextNode(clipboardText)

				if (startBlock && endBlock && startBlock !== endBlock) {
					startBlock.appendChild(textNode)
					while (endBlock.firstChild) {
						startBlock.appendChild(endBlock.firstChild)
					}
					endBlock.remove()
					moveCaretAfterNode(sel, range, textNode)
					startBlock.normalize()
				} else {
					range.insertNode(textNode)
					moveCaretAfterNode(sel, range, textNode)
					startBlock.normalize()
				}
			}
		}
	})

	state.editor.addEventListener('click', (e) => {
		const block = getBlockAncestor(e.target)
		if (!block) return

		if (block.dataset.blocktype === 'image') {
			e.preventDefault()
			clearSelection()
			block.focus()
		}
	})
}

/**
 * Set up supported block types for the instance's mode
 * @param {"simple" | "full"} mode - which mode is the editor working in
 */
async function configureBlocksForMode(mode) {
	if (mode === 'simple') {
		activeBlocks = {
			paragraph: await allBlocks.paragraph(state.options.paragraph || {}),
			image: await allBlocks.image(state.options.image || {})
		}
	} else {
		activeBlocks = {
			paragraph: await allBlocks.paragraph(state.options.paragraph || {}),
			image: await allBlocks.image(state.options.image || {}),
			heading: await allBlocks.heading(state.options.heading || {})
		}
	}
	for (const obj of Object.keys(activeBlocks)) {
		for (const tag of activeBlocks[obj].pasteSupport) {
			state.pasteSupport.push(tag)
		}
	}
	if (state.options.debug === true) {
		console.log(`CSBE v${version}`)
		console.log(`Supported tags on paste: ${state.pasteSupport.join(', ')}`)
		console.log('Active Blocks:')
		for (const obj of Object.keys(activeBlocks)) {
			console.log(`${activeBlocks[obj].name} [${activeBlocks[obj].slug}]: v${activeBlocks[obj].version}`)
			console.log(activeBlocks[obj].meta)
		}
	}
}

/**
 * Create initial paragraph block
 */
async function createInitialBlock() {
	const blockDef = activeBlocks.paragraph
	const block = await blockDef.create()

	state.editor.appendChild(block)

	// Focus the editor, not the block
	state.editor.focus()

	// Place caret inside the new paragraph
	placeCaretAtEnd(block)
}

/**
 * Create editor host
 */
function setupEmptyEditor() {
	if (!state.root) return

	state.root.innerHTML = ''

	const editor = document.createElement('div')
	editor.className = 'csbe-editor'
	editor.setAttribute('contenteditable', 'true')

	state.root.appendChild(editor)
	state.editor = editor
}

/* ───────────────────────────────────────────── */

/**
 * Load an existing document into the editor
 * @param {CSBEDocument} doc - document to load
 * @param {Boolean} [focus] - whether to focus the editor following the load
 */
function load(doc, focus = false) {
	if (!doc.type || doc.type !== 'application/csbe') {
		throw new Error('CSBE: The documenent is not of type "application/csbe"')
	}
	if (!Array.isArray(doc.blocks)) {
		throw new Error('CSBE: The document does not have any blocks')
	}

	state.editor.innerHTML = ''

	try {
		for (const block of doc.blocks) {
			// console.log(block)
			if (activeBlocks[block.type]) {
				const ele = activeBlocks[block.type].load(block)
				state.editor.appendChild(ele)
			}
		}
		if (focus) state.editor.focus()
	} catch (error) {
		throw new Error({ message: 'CSBE: Error loading document', doc, error })
	}
}

/**
 * Render an existing document into an HTML element
 * @param {HTMLElement} host - element to render into
 * @param {CSBEDocument} doc - document to render
 */
function renderDocument(host, doc) {
	if (!(host instanceof HTMLElement)) {
		throw new Error('CSBE: The first argument must be an HTMLElement. Example: csbe.render(document.getElementById("csbe"), doc)')
	}
	if (!doc.type || doc.type !== 'application/csbe') {
		throw new Error('CSBE: The documenent is not of type "application/csbe"')
	}
	if (!Array.isArray(doc.blocks)) {
		throw new Error('CSBE: The document does not have any blocks')
	}

	host.innerHTML = ''

	try {
		for (const block of doc.blocks) {
			if (activeBlocks[block.type]) {
				const ele = activeBlocks[block.type].render(block)
				host.appendChild(ele)
			}
		}
	} catch (error) {
		throw new Error({ message: 'CSBE: Error rendering document', doc, error })
	}
}

/**
 * Render the existing editor into an HTML element
 * @param {HTMLElement} host - element to render into
 */
function renderEditor(host) {
	if (!(host instanceof HTMLElement)) {
		throw new Error('CSBE: The first argument must be an HTMLElement. Example: csbe.render(document.getElementById("csbe"), doc)')
	}

	host.innerHTML = ''

	const blocks = state.editor.querySelectorAll('.csbe-block')
	try {
		for (const block of blocks) {
			if (activeBlocks[block.dataset.blocktype]) {
				const def = activeBlocks[block.dataset.blocktype].save(block)
				const ele = activeBlocks[block.dataset.blocktype].render(def)
				host.appendChild(ele)
			}
		}
	} catch (error) {
		throw new Error({ message: 'CSBE: Error rendering editor', error })
	}
}

/**
 * Return the contents of the editor as a JavaScript Array
 * @returns {CSBEDocument}
 */
function save() {
	const data = []
	const blocks = state.editor.querySelectorAll('.csbe-block')
	for (const block of blocks) {
		data.push(activeBlocks[block.dataset.blocktype].save(block))
	}
	while (data.length > 1) {
		const last = data[data.length - 1]
		if (!activeBlocks[last.type].isEmpty(last)) break
		data.pop()
	}
	const csbeDocument = {
		type: 'application/csbe',
		version,
		schema: 'csbe-blocks-0.1',
		blocks: data
	}
	return csbeDocument
}

/**
 * Destroy the current block editor and reset all of its settings
 */
function destroy() {
	if (state.root) state.root.innerHTML = ''
	state.root = null
	state.editor = null
	state.options = {}
	state.pasteSupport = []
	activeBlocks = {}
}

/* ───────────────────────────────────────────── */

/**
 * Determine if the caret is at the end of the current block
 * @param {HTMLElement} block - current block
 * @param {Range} range - current range
 * @returns {Boolean}
 */
function atEndOfBlock(block, range) {
	const lastChild = block.lastChild
	const atEndOfBlock =
        range.startContainer === lastChild &&
        range.startOffset === (lastChild.nodeType === Node.TEXT_NODE ? lastChild.textContent.length : lastChild.childNodes.length)
	// console.log({ atEndOfBlock, lastChild: range.startContainer === lastChild })
	return atEndOfBlock
}

/**
 * Determine if the caret is at the start of the current block
 * @param {HTMLElement} block - current block
 * @param {Range} range - current range
 * @returns {Boolean}
 */
function atStartOfBlock(block, range) {
	// Case 1: caret is inside a text node
	if (range.startContainer.nodeType === Node.TEXT_NODE) {
		return range.startOffset === 0 &&
               range.startContainer === block.firstChild
	}

	// Case 2: caret is inside the block element itself
	// e.g. caret is between <br> and next text node
	if (range.startContainer === block) {
		// If caret is before the first child → true start of block
		return range.startOffset === 0
	}

	return false
}

/**
 * Clear any active text selection
 */
function clearSelection() {
	const sel = window.getSelection()
	if (!sel) return
	sel.removeAllRanges()
}

function findInlineAncestor(node, tag) {
	tag = tag.toLowerCase()
	while (node) {
		if (node.nodeType === 1 && node.tagName.toLowerCase() === tag) {
			return node
		}
		node = node.parentNode
	}
	return null
}

/**
 * Get the container block
 * @param {HTMLElement} node - node to check
 * @returns {HTMLElement}
 */
function getBlockAncestor(node) {
	// console.log(node, node.nodeType, node.parentNode, node.parentNode.nodeType)
	if (node.nodeType === Node.TEXT_NODE) node = node.parentNode
	if (node.classList.contains('csbe-editor')) return null
	while (node) {
		if (node.classList.contains('csbe-block')) return node
		node = node.parentNode
	}
	return null
}

/**
 * Test if the block allows merging
 * @param {HTMLElement} node - block to retrieve setting
 * @returns {Boolean | null}
 */
function getBlockMergeSetting(node) {
	if (!node) return null
	if (node.nodeType === Node.TEXT_NODE) return null
	const blockType = node.dataset.blocktype
	return activeBlocks[blockType].allowMerge
}

/**
 * Calculate the caret position offset within the current block
 * @param {HTMLElement} block - current block
 * @param {Range} range - current range
 * @returns {Number}
 */
function getCaretOffsetInBlock(block, range) {
	let offset = 0

	const walker = document.createTreeWalker(
		block,
		NodeFilter.SHOW_TEXT,
		null
	)

	while (walker.nextNode()) {
		const node = walker.currentNode
		if (node === range.startContainer) {
			return offset + range.startOffset
		}
		offset += node.textContent.length
	}

	return offset
}

/**
 * Handle user creating a new block
 * @param {HTMLElement} block - block where Enter was pressed
 * @param {Range} range - current selection
 */
function handleEnter(block, range) {
	const isAtEnd = isCaretAtEnd(block, range)
	console.log({ block, range, isAtEnd })

	if (isAtEnd) {
		splitAtEnd(block)
	} else {
		splitInMiddle(block, range)
	}
}

/**
 * Paste supported HTML contents of the clipboard at the start or end of a block
 * @param {HTMLElement} block - current block
 * @param {HTMLElement} body - contents of the clipboard body
 * @param {"before" | "after"} position - where the clipboard blocks should be inserted
 */
function handleHTMLPaste(block, body, position) {
	let lastBlock = block
	for (const ele of body.childNodes) {
		// console.log(ele)
		let blockType
		if (state.pasteSupport.includes(ele.tagName)) {
			for (const obj of Object.keys(activeBlocks)) {
				if (activeBlocks[obj].pasteSupport.includes(ele.tagName)) {
					blockType = activeBlocks[obj]
					break
				}
			}
			const newBlock = blockType.paste(ele)
			if (position === 'before') {
				block.before(newBlock)
			} else {
				lastBlock.after(newBlock)
				lastBlock = newBlock
			}
		}
	}
	if (position === 'after' && lastBlock) placeCaretAtEnd(lastBlock)
}

/**
 * Paste supported HTML contents of the clipboard in the middle of a block
 * @param {HTMLElement} block - active block
 * @param {Range} range - current selection
 * @param {HTMLElement} body - content to paste
 */
function hanldeHTMLPasteInMiddle(block, range, body) {
	// 1. Split the block at caret
	const expanded = document.createRange()
	expanded.setStart(range.startContainer, range.startOffset)
	expanded.setEndAfter(block.lastChild)

	const rightFragment = trimFragment(expanded.cloneContents())
	expanded.deleteContents()

	const blockType = activeBlocks[block.dataset.blocktype]
	const newRightBlock = blockType.clone(block)
	newRightBlock.innerHTML = ''
	newRightBlock.appendChild(rightFragment)

	// Insert right block after current block
	state.editor.insertBefore(newRightBlock, block.nextSibling)

	// 2. Insert HTML blocks between left and right halves
	let lastInserted = block
	for (const ele of body.childNodes) {
		if (state.pasteSupport.includes(ele.tagName)) {
			let blockType
			for (const obj of Object.keys(activeBlocks)) {
				if (activeBlocks[obj].pasteSupport.includes(ele.tagName)) {
					blockType = activeBlocks[obj]
					break
				}
			}
			const newBlock = blockType.paste(ele)
			lastInserted.after(newBlock)
			lastInserted = newBlock
		}
	}

	block.normalize()
	newRightBlock.normalize()

	// 3. Caret placement
	const lastBlock = lastInserted

	if (lastBlock.dataset.blocktype === 'image') {
		clearSelection()
		lastBlock.focus()
	} else {
		placeCaretAtEnd(lastBlock)
	}
}

/**
 * Paste supported HTML contents of the clipboard when the current selection crosses blocks
 * @param {HTMLElement} startBlock - block with the start of the selection
 * @param {HTMLElement} endBlock - block with the end of the selection
 * @param {Range} range - current selection
 * @param {HTMLElement} body - content to paste
 */
function handleHTMLPasteSelectionAcrossBlocks(startBlock, endBlock, range, body) {
	// 1. Extract left fragment from startBlock
	const leftRange = document.createRange()
	leftRange.setStart(startBlock.firstChild, 0)
	leftRange.setEnd(range.startContainer, range.startOffset)
	const leftFragment = trimFragment(leftRange.cloneContents())

	// 2. Extract right fragment from endBlock
	const rightRange = document.createRange()
	rightRange.setStart(range.endContainer, range.endOffset)
	rightRange.setEndAfter(endBlock.lastChild)
	const rightFragment = trimFragment(rightRange.cloneContents())

	// 3. Remove everything between startBlock and endBlock
	let node = startBlock.nextSibling
	while (node && node !== endBlock) {
		const next = node.nextSibling
		node.remove()
		node = next
	}

	// 4. Replace startBlock content with left fragment
	startBlock.innerHTML = ''
	startBlock.appendChild(leftFragment)

	// 5. Remove endBlock entirely
	endBlock.remove()

	// 6. Insert clipboard blocks after startBlock
	let lastInserted = startBlock
	for (const ele of body.childNodes) {
		if (state.pasteSupport.includes(ele.tagName)) {
			let blockType
			for (const obj of Object.keys(activeBlocks)) {
				if (activeBlocks[obj].pasteSupport.includes(ele.tagName)) {
					blockType = activeBlocks[obj]
					break
				}
			}
			const newBlock = blockType.paste(ele)
			lastInserted.after(newBlock)
			lastInserted = newBlock
		}
	}

	// 7. Insert the right fragment as a cloned block of endBlock
	const endType = activeBlocks[endBlock.dataset.blocktype]
	const newRightBlock = endType.clone(endBlock)
	newRightBlock.innerHTML = ''
	newRightBlock.appendChild(rightFragment)
	lastInserted.after(newRightBlock)

	startBlock.normalize()
	newRightBlock.normalize()

	// 8. Caret placement
	if (lastInserted.dataset.blocktype === 'image') {
		clearSelection()
		lastInserted.focus()
	} else {
		placeCaretAtEnd(lastInserted)
	}
}

/**
 * Paste supported HTML contents of the clipboard when the current selection is inside a block
 * @param {HTMLElement} block - block with the start of the selection
 * @param {Range} range - current selection
 * @param {HTMLElement} body - content to paste
 */
function handleHTMLPasteSelectionInsideSingleBlock(block, range, body) {
	// 1. Delete selected content
	range.deleteContents()

	const sel = window.getSelection()
	const newRange = sel.getRangeAt(0)

	// 2. Split block at caret
	const expanded = document.createRange()
	expanded.setStart(newRange.startContainer, newRange.startOffset)
	expanded.setEndAfter(block.lastChild)

	const rightFragment = trimFragment(expanded.cloneContents())
	expanded.deleteContents()

	const blockType = activeBlocks[block.dataset.blocktype]
	const newRightBlock = blockType.clone(block)
	newRightBlock.innerHTML = '' // clear content
	newRightBlock.appendChild(rightFragment)

	state.editor.insertBefore(newRightBlock, block.nextSibling)

	// 3. Insert HTML blocks between
	let lastInserted = block
	for (const ele of body.childNodes) {
		if (state.pasteSupport.includes(ele.tagName)) {
			let blockType
			for (const obj of Object.keys(activeBlocks)) {
				if (activeBlocks[obj].pasteSupport.includes(ele.tagName)) {
					blockType = activeBlocks[obj]
					break
				}
			}
			const newBlock = blockType.paste(ele)
			lastInserted.after(newBlock)
			lastInserted = newBlock
		}
	}

	// 4. Caret placement
	const lastBlock = lastInserted
	if (lastBlock.dataset.blocktype === 'image') {
		clearSelection()
		lastBlock.focus()
	} else {
		placeCaretAtEnd(lastBlock)
	}
}

function handleInline(block, sel, range, tag) {
	const wrapperTag = tag.toLowerCase()

	if (range.collapsed) {
		// caret-only: insert empty tag
		const wrapper = document.createElement(wrapperTag)
		const zwsp = document.createTextNode('\u200b')
		wrapper.appendChild(zwsp)
		range.insertNode(wrapper)

		const newRange = document.createRange()
		newRange.setStart(zwsp, 1)
		newRange.collapse(true)

		sel.removeAllRanges()
		sel.addRange(newRange)
		return
	}

	// expanded selection
	const startInline = findInlineAncestor(range.startContainer, wrapperTag)
	const endInline = findInlineAncestor(range.endContainer, wrapperTag)

	// selection fully inside same inline tag → UNWRAP
	if (startInline && startInline === endInline) {
		unwrapInline(sel, range, startInline)
		block.normalize()
		return
	}

	// otherwise → WRAP
	wrapInline(sel, range, wrapperTag)
	block.normalize()
}

/**
 * Check if the cursor is at the end of the current block
 * @param {HTMLElement} block - current block
 * @param {Range} range - range to check
 * @returns {Number}
 */
function isCaretAtEnd(block, range) {
	const endRange = document.createRange()

	try {
		endRange.setStart(range.endContainer, range.endOffset)
		endRange.setEnd(block, block.childNodes.length)
	} catch (e) {
		// Fallback: assume not at end if range is weird
		return false
	}

	const contents = endRange.cloneContents()
	// console.log({ textContentEmpty: contents.textContent === '', childNodes: contents.childNodes.length === 0 })
	return contents.textContent === '' && contents.childNodes.length === 0
}

/**
 * Handle merging blocks when a user deletes with the selection spanning multiple blocks
 * @param {Range} range - current selection
 * @param {HTMLElement} startBlock - block at start of selection
 * @param {HTMLElement} endBlock - block at end of selection
 */
function mergeBlocksAcrossSelection(range, startBlock, endBlock) {
	// 0. Capture caret position BEFORE deleting content
	const sel = window.getSelection()
	const caretOffset = range.startOffset
	const caretContainer = range.startContainer

	// 1. Delete the selected content
	range.deleteContents()

	// 2. Move the remaining content of endBlock into startBlock
	while (endBlock.firstChild) {
		startBlock.appendChild(endBlock.firstChild)
	}

	// 3. Remove the now-empty endBlock
	endBlock.remove()

	// 4. Normalize merged content
	startBlock.normalize()

	// 5. Restore caret to original position
	const newRange = document.createRange()

	// If the caret was inside startBlock text
	if (startBlock.contains(caretContainer)) {
		// Restore using the original container + offset
		newRange.setStart(caretContainer, Math.min(caretOffset, caretContainer.length))
	} else {
		// Fallback: place at start of startBlock
		newRange.setStart(startBlock, 0)
	}

	newRange.collapse(true)
	sel.removeAllRanges()
	sel.addRange(newRange)
}

/**
 * Merge the contents of the current block with the next block
 * @param {HTMLElement} block - current block
 * @param {HTMLElement} nextBlock - next block
 * @param {Range} range - current range
 */
function mergeWithNext(block, nextBlock, range) {
	if (!block || !nextBlock) return

	// 1. Capture caret offset BEFORE merge
	const caretOffset = getCaretOffsetInBlock(block, range)

	// 2. Merge HTML
	const currHTML = block.innerHTML
	const nextHTML = nextBlock.innerHTML

	const needsSpace =
        currHTML !== '' &&
        nextHTML !== '' &&
        !/[\s]$/.test(currHTML) &&
        !/^[\s]/.test(nextHTML)

	block.innerHTML = currHTML + (needsSpace ? ' ' : '') + nextHTML

	nextBlock.remove()

	// 3. Restore caret to the correct offset
	setCaretOffsetInBlock(block, caretOffset)
}

/**
 * Merge the contents of the previous block with the current block
 * @param {HTMLElement} block - current block
 * @param {HTMLElement} prevBlock - previous block
 * @param {Range} range - current range
 */
function mergeWithPrevious(block, prevBlock, range) {
	if (!block || !prevBlock) return

	// 1. Merge HTML
	const prevHTML = prevBlock.innerHTML
	const currHTML = block.innerHTML

	const needsSpace =
        prevHTML !== '' &&
        currHTML !== '' &&
        !/[\s]$/.test(prevHTML) &&
        !/^[\s]/.test(currHTML)

	prevBlock.innerHTML = prevHTML + (needsSpace ? ' ' : '') + currHTML

	// 2. Remove the now-merged block
	block.remove()

	// 3. Restore caret inside prevBlock at the correct offset
	setCaretOffsetInBlock(prevBlock, prevHTML.length + (needsSpace ? 1 : 0))
}

/**
 * Move the caret after inserting a text node
 * @param {Selection} sel - current selection
 * @param {Range} range - current range
 * @param {HTMLElement} node - current node
 */
function moveCaretAfterNode(sel, range, node) {
	range.setStartAfter(node)
	range.setEndAfter(node)
	sel.removeAllRanges()
	sel.addRange(range)
}

/**
 * Move the caret to the end of a block
 * @param {HTMLElement} el - block to contain the caret
 */
function placeCaretAtEnd(el) {
	const range = document.createRange()
	const sel = window.getSelection()
	range.selectNodeContents(el)
	range.collapse(false)
	sel.removeAllRanges()
	sel.addRange(range)
}

/**
 * Move the caret to the start of a block
 * @param {HTMLElement} el - block to contain the caret
 */
function placeCaretAtStart(el) {
	const range = document.createRange()
	const sel = window.getSelection()
	range.setStart(el, 0)
	range.collapse(true)
	sel.removeAllRanges()
	sel.addRange(range)
}

/**
 * Move the caret within a block to a specific offset
 * @param {HTMLElement} block - current block
 * @param {Number} offset - bumber of characters to offset position
 */
function setCaretOffsetInBlock(block, offset) {
	console.log({ block, offset })
	const walker = document.createTreeWalker(
		block,
		NodeFilter.SHOW_TEXT,
		null
	)

	while (walker.nextNode()) {
		const node = walker.currentNode
		if (offset <= node.textContent.length) {
			const range = document.createRange()
			const sel = window.getSelection()

			range.setStart(node, offset)
			range.collapse(true)

			sel.removeAllRanges()
			sel.addRange(range)
			return
		}
		offset -= node.textContent.length
	}

	// fallback: place at end
	placeCaretAtEnd(block)
}

/**
 * Create a new paragraph block after the current block
 * @param {HTMLElement} block - current block
 */
async function splitAtEnd(block) {
	const newBlock = await activeBlocks.paragraph.create()
	state.editor.appendChild(newBlock)
	placeCaretAtEnd(newBlock)
}

/**
 * Create a new block clipping the current block's content
 * @param {HTMLElement} block - current block
 * @param {Range} range - current range
 */
async function splitInMiddle(block, range) {
	// Create a new range so we don't mutate the selection
	const expanded = document.createRange()
	expanded.setStart(range.startContainer, range.startOffset)
	expanded.setEndAfter(block.lastChild)

	// Clone the right side
	const rightFragment = trimFragment(expanded.cloneContents())
	// console.log({ block, range, rightFragment })

	// Remove the right side from the original block
	expanded.deleteContents()

	// Create the new block
	const blockType = activeBlocks[block.dataset.blocktype]
	const newBlock = blockType.clone(block)
	newBlock.innerHTML = ''

	// Insert the cloned content
	newBlock.appendChild(rightFragment)

	// Insert into DOM
	state.editor.insertBefore(newBlock, block.nextSibling)

	block.normalize()
	newBlock.normalize()

	// Place caret at start of new block
	placeCaretAtStart(newBlock)
}

function trimFragment(fragment) {
	const walker = document.createTreeWalker(
		fragment,
		NodeFilter.SHOW_TEXT
	)
	const textNodes = []

	while (walker.nextNode()) textNodes.push(walker.currentNode)

	if (textNodes.length > 0) {
		// Trim leading whitespace
		textNodes[0].textContent = textNodes[0].textContent.replace(/^\s+/, '')

		// Trim trailing whitespace
		const last = textNodes[textNodes.length - 1]
		last.textContent = last.textContent.replace(/\s+$/, '')
	}

	return fragment
}

function unwrapInline(sel, range, inlineNode) {
	// extract selected portion (browser will split inlineNode as needed)
	const extracted = range.extractContents()

	// replace selection with plain text
	const plain = document.createTextNode(extracted.textContent)
	range.insertNode(plain)

	// restore selection to that plain text
	const newRange = document.createRange()
	newRange.setStart(plain, 0)
	newRange.setEnd(plain, plain.length)

	sel.removeAllRanges()
	sel.addRange(newRange)
}

function wrapInline(sel, range, tag) {
	const wrapper = document.createElement(tag)
	const contents = range.extractContents()
	wrapper.appendChild(contents)
	range.insertNode(wrapper)

	const newRange = document.createRange()
	newRange.selectNodeContents(wrapper)

	sel.removeAllRanges()
	sel.addRange(newRange)
}
