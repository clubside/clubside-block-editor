import {
	applyDatasetStyles,
	applySettingsStyles,
	checkSettingsStyles,
	extractCommonSettings,
	generateId,
	initCommonDataset
} from '../core/common.js'

/**
 * @typedef {Object} CSBEHeadingSettings
 * @property {String} uuid - unique identifier for the block
 * @property {"1" | "2" | "3" | "4" | "5" | "6"} level - level to use to determine HTML <h{level}> element
 * @property {String} align - text alignment for the heading
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
 * @typedef {Object} CSBEHeading
 * @property {String} type - type of block
 * @property {Number} version - version of block
 * @property {CSBEBlockMeta} meta - meta for the block
 * @property {String} content - HTML content of the block
 * @property {CSBEHeadingSettings} settings - settings for the block
 */

/**
 * @typedef {Object} CSBEHeadingConfig
 * @property {Boolean} [allowH1] - whether `<h1>` should be allowed
 */

const icons = [
	{ id: 'heading', icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16"><path d="M13.4,15V1h-1.9v5.9h-6.9V1h-1.9v14h1.9v-6.4h6.9v6.4h1.9Z"/></svg>' },
	{ id: 'H1', icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16"><path d="M7.648 13V3H6.3v4.234H1.348V3H0v10h1.348V8.421H6.3V13zM14 13V3h-1.333l-2.381 1.766V6.12L12.6 4.443h.066V13z"/></svg>' },
	{ id: 'H2', icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16"><path d="M7.495 13V3.201H6.174v4.15H1.32V3.2H0V13h1.32V8.513h4.854V13zm3.174-7.071v-.05c0-.934.66-1.752 1.801-1.752 1.005 0 1.76.639 1.76 1.651 0 .898-.582 1.58-1.12 2.19l-3.69 4.2V13h6.331v-1.149h-4.458v-.079L13.9 8.786c.919-1.048 1.666-1.874 1.666-3.101C15.565 4.149 14.35 3 12.499 3 10.46 3 9.384 4.393 9.384 5.879v.05z"/></svg>' },
	{ id: 'H3', icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16"><path d="M11.07 8.4h1.049c1.174 0 1.99.69 2.004 1.724s-.802 1.786-2.068 1.779c-1.11-.007-1.905-.605-1.99-1.357h-1.21C8.926 11.91 10.116 13 12.028 13c1.99 0 3.439-1.188 3.404-2.87-.028-1.553-1.287-2.221-2.096-2.313v-.07c.724-.127 1.814-.935 1.772-2.293-.035-1.392-1.21-2.468-3.038-2.454-1.927.007-2.94 1.196-2.981 2.426h1.23c.064-.71.732-1.336 1.744-1.336 1.027 0 1.744.64 1.744 1.568.007.95-.738 1.639-1.744 1.639h-.991V8.4ZM7.495 13V3.201H6.174v4.15H1.32V3.2H0V13h1.32V8.513h4.854V13z"/></svg>' },
	{ id: 'H4', icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16"><path d="M13.007 3H15v10h-1.29v-2.051H8.854v-1.18C10.1 7.513 11.586 5.256 13.007 3m-2.82 6.777h3.524v-5.62h-.074a95 95 0 0 0-3.45 5.554zM7.495 13V3.201H6.174v4.15H1.32V3.2H0V13h1.32V8.513h4.854V13z"/></svg>' },
	{ id: 'H5', icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16"><path d="M9 10.516h1.264c.193.976 1.112 1.364 2.01 1.364 1.005 0 2.067-.782 2.067-2.247 0-1.292-.983-2.082-2.089-2.082-1.012 0-1.658.596-1.924 1.077h-1.12L9.646 3h5.535v1.141h-4.415L10.5 7.28h.072c.201-.316.883-.84 1.967-.84 1.709 0 3.13 1.177 3.13 3.158 0 2.025-1.407 3.403-3.475 3.403-1.809 0-3.1-1.048-3.194-2.484ZM7.495 13V3.201H6.174v4.15H1.32V3.2H0V13h1.32V8.512h4.854V13z"/></svg>' },
	{ id: 'H6', icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16"><path d="M15.596 5.178H14.3c-.106-.444-.62-1.072-1.706-1.072-1.332 0-2.325 1.269-2.325 3.947h.07c.268-.67 1.043-1.445 2.445-1.445 1.494 0 3.017 1.064 3.017 3.073C15.8 11.795 14.37 13 12.48 13c-1.036 0-2.093-.36-2.77-1.452C9.276 10.836 9 9.808 9 8.37 9 4.656 10.494 3 12.636 3c1.812 0 2.883 1.113 2.96 2.178m-5.151 4.566c0 1.367.944 2.15 2.043 2.15 1.128 0 2.037-.684 2.037-2.136 0-1.41-1-2.065-2.03-2.065-1.19 0-2.05.853-2.05 2.051M7.495 13V3.201H6.174v4.15H1.32V3.2H0V13h1.32V8.513h4.854V13z"/></svg>' },
	{ id: 'inherit', icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M6.364 2.5a.5.5 0 0 1 .5-.5H13.5A1.5 1.5 0 0 1 15 3.5v10a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 2 13.5V6.864a.5.5 0 1 1 1 0V13.5a.5.5 0 0 0 .5.5h10a.5.5 0 0 0 .5-.5v-10a.5.5 0 0 0-.5-.5H6.864a.5.5 0 0 1-.5-.5"/><path fill-rule="evenodd" d="M11 10.5a.5.5 0 0 1-.5.5h-5a.5.5 0 0 1 0-1h3.793L1.146 1.854a.5.5 0 1 1 .708-.708L10 9.293V5.5a.5.5 0 0 1 1 0z"/></svg>' },
	{ id: 'align-left', icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M2 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5m0-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5"/></svg>' },
	{ id: 'align-center', icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M4 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5m2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5"/></svg>' },
	{ id: 'align-right', icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M6 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m-4-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5m4-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m-4-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5"/></svg>' },
	{ id: 'align-justify', icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M2 12.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5m0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5m0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5m0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5"/></svg>' }
]

/**
 * CSBE Paragraph
 * @param {CSBEHeadingConfig} config - options for the block
 * @returns {CSBEBlock}
 */
export default async function heading(config) {
	const version = '0.1.0'
	/** @type {CSBEBlockMeta} */
	const meta = { author: 'Chris Rowley', description: 'Simple heading' }

	/** @type {CSBEBlockPropertyValue[]} */
	const levels = []
	const tags = []
	if (config && config.allowH1) {
		levels.push({ value: 1, text: 'H1', icon: icons.find(lookup => lookup.id === 'H1') })
		tags.push('h1')
	}
	for (let i = 2; i <= 6; i++) {
		levels.push({ value: i, text: `H${i}`, icon: icons.find(lookup => lookup.id === `H${i}`) })
		tags.push(`h${i}`)
	}

	/** @type {CSBEBlockPropertyValue[]} */
	const alignments = [
		{ value: 'inherit', text: 'Inherit', icon: icons.find(lookup => lookup.id === 'inherit') },
		{ value: 'left', text: 'Left', icon: icons.find(lookup => lookup.id === 'align-left') },
		{ value: 'center', text: 'Center', icon: icons.find(lookup => lookup.id === 'align-center') },
		{ value: 'right', text: 'Right', icon: icons.find(lookup => lookup.id === 'align-right') },
		{ value: 'justify', text: 'Justify', icon: icons.find(lookup => lookup.id === 'align-justify') }
	]

	return {
		name: 'Heading',
		slug: 'heading',
		icon: icons.find(lookup => lookup.id === 'heading'),
		class: 'csbe-heading',
		pasteSupport: tags,
		allowMerge: true,
		config,
		version,
		meta,

		properties: [
			{
				name: 'Level',
				slug: 'level',
				values: levels,
				toolbar: true
			},
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
			const heading = document.createElement('h2')
			initCommonDataset(heading)
			heading.dataset.blocktype = 'heading'
			heading.dataset.uuid = generateId()
			heading.dataset.level = 2
			heading.dataset.align = 'inherit'
			heading.classList.add('csbe-block')
			heading.classList.add('csbe-heading')
			return heading
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
		 * @param {CSBEHeading} block - existing block definition
		 * @returns {HTMLElement}
		 */
		load(block) {
			/** @type {HTMLElement} */
			const heading = document.createElement(`h${block.settings.level}`)
			initCommonDataset(heading)
			heading.dataset.blocktype = 'heading'
			heading.dataset.uuid = block.settings.uuid
			heading.dataset.level = block.settings.level
			heading.dataset.align = block.settings.align
			heading.classList.add('csbe-block')
			heading.classList.add('csbe-heading')

			if (block.settings.classes) {
				heading.dataset.classes = block.settings.classes
				block.settings.classes.split(' ').forEach(c => heading.classList.add(c))
			}

			if (block.settings.align !== 'inherit') {
				heading.style.textAlign = block.settings.align
			}

			return applySettingsStyles(heading, block)
		},

		/**
		 * Re-render HTML element after property change
		 * @param {CSBEHeading} block - source HTML element to render
		 * @returns {HTMLElement}
		 */
		render(block) {
			/** @type {HTMLElement} */
			const heading = document.createElement(`h${block.settings.level}`)
			heading.innerHTML = block.content

			heading.classList.add('csbe-heading')
			if (block.settings.classes) {
				block.settings.classes.split(' ').forEach(c => heading.classList.add(c))
			}

			if (block.settings.align !== 'inherit') {
				heading.style.textAlign = block.settings.align
			}

			return applySettingsStyles(heading, block)
		},

		/**
		 * Save the HTML element as JavaScript object
		 * @param {HTMLElement} ele - source HTML element
		 * @returns {CSBEHeading}
		 */
		save(ele) {
			return {
				type: 'heading',
				version,
				meta,
				content: ele.innerHTML,
				settings: {
					level: ele.dataset.level,
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
			const heading = document.createElement(`h${ele.dataset.level}`)
			initCommonDataset(heading)
			heading.dataset.blocktype = 'heading'
			heading.dataset.uuid = ele.dataset.uuid
			heading.dataset.level = ele.dataset.level
			heading.dataset.align = ele.dataset.align
			heading.classList.add('csbe-block')
			heading.classList.add('csbe-heading')

			if (ele.dataset.classes !== '') {
				heading.dataset.classes = ele.dataset.classes
				ele.dataset.classes.split(' ').forEach(c => heading.classList.add(c))
			}

			if (ele.dataset.align !== 'inherit') {
				heading.style.textAlign = ele.dataset.align
			}

			return applyDatasetStyles(heading, ele)
		}
	}
}
