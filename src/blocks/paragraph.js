import {
	applyDatasetStyles,
	applySettingsStyles,
	checkSettingsStyles,
	extractCommonSettings,
	generateId,
	initCommonDataset
} from '../core/common.js'

/**
 * @typedef {Object} CSBEParagraphSettings
 * @property {String} uuid - unique identifier for the block
 * @property {String} align - text alignment for the paragraph
 * @property {String} [id] - HTML id
 * @property {String} [classes] - list of additional CSS classes separated by spaces
 * @property {String} [padding] - CSS `padding` value
 * @property {String} [paddingLeft] - CSS `padding-left` value
 * @property {String} [paddingRight] - CSS `padding-right` value
 * @property {String} [paddingTop] - CSS `padding-top` value
 * @property {String} [paddingBottom] - CSS `padding-bottom` value
 * @property {String} [margin] - CSS `margin` value
 * @property {String} [marginLeft] - CSS `margin-left` value
 * @property {String} [marginRight] - CSS `margin-right` value
 * @property {String} [marginTop] - CSS `margin-top` value
 * @property {String} [marginBottom] - CSS `margin-bottom` value
 * @property {String} [parent] - unique identifier for block's parent
 * @property {String} [children] - list of unique identifiers for children of block separated by spaces
 * @property {"true" | "false"} [locked] - whether the block is locked from property changes
 */

/**
 * @typedef {Object} CSBEParagraph
 * @property {String} type - type of block
 * @property {Number} version - version of block
 * @property {CSBEBlockMeta} meta - meta for the block
 * @property {String} content - HTML content of the block
 * @property {CSBEParagraphSettings} settings - settings for the block
 */

const icons = [
	{ id: 'paragraph', icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16"><path d="M10.5 15a.5.5 0 0 1-.5-.5V2H9v12.5a.5.5 0 0 1-1 0V9H7a4 4 0 1 1 0-8h5.5a.5.5 0 0 1 0 1H11v12.5a.5.5 0 0 1-.5.5"/></svg>' },
	{ id: 'inherit', icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M6.364 2.5a.5.5 0 0 1 .5-.5H13.5A1.5 1.5 0 0 1 15 3.5v10a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 2 13.5V6.864a.5.5 0 1 1 1 0V13.5a.5.5 0 0 0 .5.5h10a.5.5 0 0 0 .5-.5v-10a.5.5 0 0 0-.5-.5H6.864a.5.5 0 0 1-.5-.5"/><path fill-rule="evenodd" d="M11 10.5a.5.5 0 0 1-.5.5h-5a.5.5 0 0 1 0-1h3.793L1.146 1.854a.5.5 0 1 1 .708-.708L10 9.293V5.5a.5.5 0 0 1 1 0z"/></svg>' },
	{ id: 'align-left', icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M2 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5m0-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5"/></svg>' },
	{ id: 'align-center', icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M4 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5m2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5"/></svg>' },
	{ id: 'align-right', icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M6 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m-4-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5m4-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m-4-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5"/></svg>' },
	{ id: 'align-justify', icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M2 12.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5m0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5m0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5m0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5"/></svg>' }
]

/**
 * CSBE Paragraph
 * @param {Object} config - options for the block
 * @returns {CSBEBlock}
 */
export default async function paragraph(config) {
	const version = '0.1.0'
	/** @type {CSBEBlockMeta} */
	const meta = { author: 'Chris Rowley', description: 'Simple paragraph' }
	/** @type {CSBEBlockPropertyValue[]} */
	const alignments = [
		{ value: 'inherit', text: 'Inherit', icon: icons.find(lookup => lookup.id === 'inherit') },
		{ value: 'left', text: 'Left', icon: icons.find(lookup => lookup.id === 'align-left') },
		{ value: 'center', text: 'Center', icon: icons.find(lookup => lookup.id === 'align-center') },
		{ value: 'right', text: 'Right', icon: icons.find(lookup => lookup.id === 'align-right') },
		{ value: 'justify', text: 'Justify', icon: icons.find(lookup => lookup.id === 'align-justify') }
	]

	return {
		name: 'Paragraph',
		slug: 'paragraph',
		icon: icons.find(lookup => lookup.id === 'paragraph'),
		class: 'csbe-paragraph',
		pasteSupport: ['P'],
		allowMerge: true,
		config,
		version,
		meta,

		properties: [
			{
				name: 'Alignment',
				slug: 'align',
				values: alignments,
				toolbar: true
			}
		],

		/**
		 * Create a new paragraph element
		 * @param {HTMLElement} ele - source element
		 * @returns {HTMLElement}
		 */
		clone(ele) {
			/** @type {HTMLElement} */
			const copy = ele.cloneNode(true)
			copy.dataset.uuid = generateId()
			return copy
		},

		/**
		 * Create a new paragraph element
		 * @returns {HTMLElement}
		 */
		async create() {
			/** @type {HTMLElement} */
			const p = document.createElement('p')
			initCommonDataset(p)
			p.dataset.blocktype = 'paragraph'
			p.dataset.uuid = generateId()
			p.dataset.align = 'inherit'
			p.classList.add('csbe-block')
			p.classList.add('csbe-paragraph')
			return p
		},

		/**
		 * Verify if a block has no content or customization
		 * @param {CSBEParagraph} block - the blockm to check
		 * @returns {Boolean}
		 */
		isEmpty(block) {
			if (block.content !== '') return false
			if (block.settings.align !== 'inherit') return false
			if (!checkSettingsStyles(block)) return false
			return true
		},

		/**
		 * Load a paragraph block definition and return a rendered HTML element
		 * @param {CSBEParagraph} block - existing block definition
		 * @returns {HTMLElement}
		 */
		load(block) {
			/** @type {HTMLElement} */
			const p = document.createElement('p')
			initCommonDataset(p)
			p.dataset.blocktype = 'paragraph'
			p.dataset.uuid = block.settings.uuid
			p.dataset.align = block.settings.align
			p.classList.add('csbe-block')
			p.classList.add('csbe-paragraph')

			if (block.settings.classes) {
				p.dataset.classes = block.settings.classes
				block.settings.classes.split(' ').forEach(c => p.classList.add(c))
			}

			if (block.settings.align !== 'inherit') {
				p.style.textAlign = block.settings.align
			}

			p.innerHTML = block.content

			return applySettingsStyles(p, block)
		},

		/**
		 * Create a new paragraph from a clipboard element
		 * @param {HTMLElement} ele - source element
		 * @returns {HTMLElement}
		 */
		paste(ele) {
			/** @type {HTMLElement} */
			const p = document.createElement('p')
			initCommonDataset(p)
			p.dataset.blocktype = 'paragraph'
			p.dataset.uuid = generateId()
			p.dataset.align = 'inherit'
			p.classList.add('csbe-block')
			p.classList.add('csbe-paragraph')
			if (['left', 'center', 'right', 'justify'].includes(ele.style.textAlign)) {
				p.dataset.align = ele.style.textAlign
				p.style.textAlign = ele.style.textAlign
			}
			p.innerHTML = ele.innerHTML
			return p
		},

		/**
		 * Re-render HTML element after property change
		 * @param {CSBEParagraph} ele - source HTML element to render
		 * @returns {HTMLElement}
		 */
		render(block) {
			/** @type {HTMLElement} */
			const p = document.createElement('p')
			p.innerHTML = block.content

			p.classList.add('csbe-paragraph')
			if (block.settings.classes) {
				block.settings.classes.split(' ').forEach(c => p.classList.add(c))
			}

			if (block.settings.align !== 'inherit') {
				p.style.textAlign = block.settings.align
			}

			return applySettingsStyles(p, block)
		},

		/**
		 * Save the HTML element as JavaScript object
		 * @param {HTMLElement} ele - source HTML element
		 * @returns {CSBEParagraph}
		 */
		save(ele) {
			return {
				type: 'paragraph',
				version,
				meta,
				content: ele.innerHTML,
				settings: {
					align: ele.dataset.align,
					...extractCommonSettings(ele)
				}
			}
		},

		/**
		 * Re-render HTML element after property change
		 * @param {HTMLElement} ele - source HTML element to render
		 * @returns {HTMLElement}
		 */
		update(ele) {
			/** @type {HTMLElement} */
			const p = document.createElement('p')
			initCommonDataset(p)
			p.dataset.blocktype = 'paragraph'
			p.dataset.uuid = ele.dataset.uuid
			p.dataset.align = ele.dataset.align
			p.classList.add('csbe-block')
			p.classList.add('csbe-paragraph')

			if (ele.dataset.classes !== '') {
				p.dataset.classes = ele.dataset.classes
				ele.dataset.classes.split(' ').forEach(c => p.classList.add(c))
			}

			if (ele.dataset.align !== 'inherit') {
				p.style.textAlign = ele.dataset.align
			}

			return applyDatasetStyles(p, ele)
		}
	}
}
