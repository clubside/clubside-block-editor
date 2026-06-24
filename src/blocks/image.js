import {
	applyDatasetStyles,
	applySettingsStyles,
	extractCommonSettings,
	generateId,
	initCommonDataset,
	restoreBlockSetting,
	restoreDatasetSetting
} from '../core/common.js'

/**
 * @typedef {Object} CSBEImageSettings
 * @property {String} uuid - unique identifier for the block
 * @property {"block"|"start"|"center"|"end"|"left"|"right"} align - alignment for the image
 * @property {String} [width] - CSS `width` value
 * @property {String} [height] - CSS `height` value
 * @property {String} [maxWidth] - CSS `max-width` value
 * @property {String} [maxHeight] - CSS `max-height` value
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
 * @typedef {Object} CSBEImage
 * @property {String} type - type of block
 * @property {Number} version - version of block
 * @property {CSBEBlockMeta} meta - meta for the block
 * @property {String} content - URL of the image
 * @property {CSBEImageSettings} settings - settings for the block
 */

const icons = [
	{ id: 'image', icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16"><path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/><path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1z"/></svg>' },
	{ id: 'block', icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16"><path d="M14,1c.6,0,1,.4,1,1v12c0,.6-.4,1-1,1H2c-.6,0-1-.4-1-1V2c0-.6.4-1,1-1h12ZM2,0C.9,0,0,.9,0,2v12c0,1.1.9,2,2,2h12c1.1,0,2-.9,2-2V2c0-1.1-.9-2-2-2H2Z"/></svg>' },
	{ id: 'align-start', icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M1.5 1a.5.5 0 0 1 .5.5v13a.5.5 0 0 1-1 0v-13a.5.5 0 0 1 .5-.5"/><path d="M3 7a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/></svg>' },
	{ id: 'align-center', icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16"><path d="M8 1a.5.5 0 0 1 .5.5V6h-1V1.5A.5.5 0 0 1 8 1m0 14a.5.5 0 0 1-.5-.5V10h1v4.5a.5.5 0 0 1-.5.5M2 7a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z"/></svg>' },
	{ id: 'align-end', icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M14.5 1a.5.5 0 0 0-.5.5v13a.5.5 0 0 0 1 0v-13a.5.5 0 0 0-.5-.5"/><path d="M13 7a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1z"/></svg>' },
	{ id: 'float-left', icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16"><g><path d="M3.9,4.4c0,.3-.2.5-.5.5s-.5-.2-.5-.5.2-.5.5-.5.5.2.5.5"/><path d="M2.6,3c-.3,0-.6.3-.6.6v3.1c0,.3.3.6.6.6h3.8c.3,0,.6-.3.6-.6v-3.1c0-.3-.3-.6-.6-.6h-3.8ZM6.4,3.3c.2,0,.3,0,.3.3v2l-1.2-.6h-.2l-1.2,1.2-.8-.6h-.2l-.8.7v-2.7c0-.2,0-.3.3-.3,0,0,3.8,0,3.8,0Z"/></g><path d="M2.5,12h7c.3,0,.5.2.5.5h0c0,.3-.2.5-.5.5H2.5c-.3,0-.5-.2-.5-.5h0c0-.3.2-.5.5-.5Z"/><path d="M9.5,3h4c.3,0,.5.2.5.5h0c0,.3-.2.5-.5.5h-4c-.3,0-.5-.2-.5-.5h0c0-.3.2-.5.5-.5Z"/><path d="M9.5,6h4c.3,0,.5.2.5.5h0c0,.3-.2.5-.5.5h-4c-.3,0-.5-.2-.5-.5h0c0-.3.2-.5.5-.5Z"/><path d="M2.5,9h11c.3,0,.5.2.5.5h0c0,.3-.2.5-.5.5H2.5c-.3,0-.5-.2-.5-.5h0c0-.3.2-.5.5-.5Z"/></svg>' },
	{ id: 'float-right', icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16"><g><path d="M10.9,4.4c0,.3-.2.5-.5.5s-.5-.2-.5-.5.2-.5.5-.5.5.2.5.5"/><path d="M9.6,3c-.3,0-.6.3-.6.6v3.1c0,.3.3.6.6.6h3.8c.3,0,.6-.3.6-.6v-3.1c0-.3-.3-.6-.6-.6h-3.8ZM13.4,3.3c.2,0,.3,0,.3.3v2l-1.2-.6h-.2l-1.2,1.2-.8-.6h-.2l-.8.7v-2.7c0-.2,0-.3.3-.3,0,0,3.8,0,3.8,0Z"/></g><path d="M2.5,12h7c.3,0,.5.2.5.5h0c0,.3-.2.5-.5.5H2.5c-.3,0-.5-.2-.5-.5h0c0-.3.2-.5.5-.5Z"/><path d="M2.5,3h4c.3,0,.5.2.5.5h0c0,.3-.2.5-.5.5H2.5c-.3,0-.5-.2-.5-.5h0c0-.3.2-.5.5-.5Z"/><path d="M2.5,6h4c.3,0,.5.2.5.5h0c0,.3-.2.5-.5.5H2.5c-.3,0-.5-.2-.5-.5h0c0-.3.2-.5.5-.5Z"/><path d="M2.5,9h11c.3,0,.5.2.5.5h0c0,.3-.2.5-.5.5H2.5c-.3,0-.5-.2-.5-.5h0c0-.3.2-.5.5-.5Z"/></svg>' }
]

/**
 * CSBE Image
 * @param {Object} config - options for the block
 * @returns {CSBEBlock}
 */
export default async function image(config) {
	const version = '0.1.0'
	/** @type {CSBEBlockMeta} */
	const meta = { author: 'Chris Rowley', description: 'Single image' }

	/** @type {CSBEBlockPropertyValue[]} */
	const alignments = [
		{ value: 'block', text: 'Block', icon: icons.find(lookup => lookup.id === 'block') },
		{ value: 'start', text: 'Left', icon: icons.find(lookup => lookup.id === 'align-start') },
		{ value: 'center', text: 'Center', icon: icons.find(lookup => lookup.id === 'align-center') },
		{ value: 'end', text: 'Right', icon: icons.find(lookup => lookup.id === 'align-end') },
		{ value: 'left', text: 'Float Left', icon: icons.find(lookup => lookup.id === 'float-left') },
		{ value: 'right', text: 'Float Right', icon: icons.find(lookup => lookup.id === 'float-right') }
	]

	return {
		name: 'Image',
		slug: 'image',
		icon: icons.find(lookup => lookup.id === 'image'),
		class: 'csbe-image',
		pasteSupport: ['IMG'],
		allowMerge: false,
		config,
		version,
		meta,

		properties: [
			{
				name: 'Alignment',
				slug: 'align',
				values: alignments,
				toolbar: true
			},
			{
				name: 'Width',
				slug: 'width'
			},
			{
				name: 'Height',
				slug: 'height'
			},
			{
				name: 'Max Width',
				slug: 'maxWidth'
			},
			{
				name: 'Max Height',
				slug: 'maxHeight'
			}
		],

		/**
		 * Create a new paragraph element
		 * @param {HTMLElement} ele - source element
		 * @returns {HTMLElement}
		 */
		clone(ele) {
			/** @type {HTMLElement} */
			const copy = ele.cloneNode(false)
			copy.dataset.uuid = generateId()
			return copy
		},

		/**
		 * Return Image-specific settings
		 * @param {HTMLElement} ele - source HTML element
		 * @returns {Object}
		 */
		_extractImageSettings(ele) {
			const settings = {}
			for (const field of this.properties) {
				if (ele.dataset[field.slug] !== '') settings[field.slug] = ele.dataset[field.slug]
			}
			return settings
		},

		/**
		 * Adds Image-specific dataset properties
		 * @param {HTMLElement} ele - source HTML element
		 */
		_initImageDataset(ele) {
			for (const field of this.properties) {
				ele.dataset[field.slug] = ''
			}
		},

		/**
		 * Create a new paragraph element
		 * @returns {HTMLElement}
		 */
		async create() {
			let url = null

			if (config.picker) {
				url = await config.picker()
			} else {
				url = prompt('URL of image')
			}

			if (!url) return null

			/** @type {HTMLElement} */
			const img = document.createElement('img')
			img.src = url
			img.tabIndex = 0
			initCommonDataset(img)
			this._initImageDataset(img)
			img.dataset.blocktype = 'image'
			img.dataset.uuid = generateId()
			img.dataset.align = 'block'
			img.classList.add('csbe-image')
			img.classList.add('csbe-block')
			return img
		},

		/**
		 * Verify if a block has no content or customization
		 * @param {CSBEImage} block - the blockm to check
		 * @returns {Boolean}
		 */
		isEmpty(block) {
			return false
		},

		/**
		 * Load a paragraph block definition and return a rendered HTML element
		 * @param {CSBEImage} block - existing block definition
		 * @returns {HTMLElement}
		 */
		load(block) {
			/** @type {HTMLElement} */
			const img = document.createElement('img')
			img.src = block.content
			img.tabIndex = 0
			initCommonDataset(img)
			this._initImageDataset(img)
			img.dataset.blocktype = 'image'
			img.dataset.uuid = block.settings.uuid
			img.classList.add('csbe-image')
			applySettingsStyles(img, block)

			if (block.settings.classes) {
				img.dataset.classes = block.settings.classes
				block.settings.classes.split(' ').forEach(c => img.classList.add(c))
			}

			restoreBlockSetting(img, block, 'width', 'width')
			restoreBlockSetting(img, block, 'height', 'height')
			restoreBlockSetting(img, block, 'maxWidth', 'maxWidth')
			restoreBlockSetting(img, block, 'maxHeight', 'maxHeight')

			const align = block.settings.align
			img.dataset.align = align

			if (['start', 'center', 'end'].includes(align)) {
				const wrapper = document.createElement('div')
				wrapper.classList.add('csbe-block')
				wrapper.dataset.wrapper = 'image'
				wrapper.style.display = 'flex'
				wrapper.style.justifyContent = align
				wrapper.appendChild(img)
				return wrapper
			}

			if (align === 'left') img.style.float = 'left'
			if (align === 'right') img.style.float = 'right'

			img.classList.add('csbe-block')
			return img
		},

		/**
		 * Create a new paragraph from a clipboard element
		 * @param {HTMLElement} ele - source element
		 * @returns {HTMLElement}
		 */
		paste(ele) {
			/** @type {HTMLElement} */
			const img = document.createElement('img')
			img.src = ele.src
			img.tabIndex = 0
			initCommonDataset(img)
			this._initImageDataset(img)
			img.dataset.blocktype = 'image'
			img.dataset.uuid = generateId()
			img.dataset.align = 'block'
			img.classList.add('csbe-image')
			img.classList.add('csbe-block')
			return img
		},

		/**
		 * Re-render HTML element version of block
		 * @param {CSBEImage} block - source HTML element to render
		 * @returns {HTMLElement}
		 */
		render(block) {
			/** @type {HTMLElement} */
			const img = document.createElement('img')
			img.src = block.content

			img.classList.add('csbe-image')
			if (block.settings.classes) {
				block.settings.classes.split(' ').forEach(c => img.classList.add(c))
			}

			restoreBlockSetting(img, block, 'width', 'width', true)
			restoreBlockSetting(img, block, 'height', 'height', true)
			restoreBlockSetting(img, block, 'maxWidth', 'maxWidth', true)
			restoreBlockSetting(img, block, 'maxHeight', 'maxHeight', true)

			const align = block.settings.align

			if (['start', 'center', 'end'].includes(align)) {
				/** @type {HTMLElement} */
				const wrapper = document.createElement('div')
				wrapper.style.display = 'flex'
				wrapper.style.justifyContent = align
				wrapper.appendChild(img)
				return wrapper
			}

			if (align === 'left') img.style.float = 'left'
			if (align === 'right') img.style.float = 'right'

			return img
		},

		/**
		 * Save the HTML element as JavaScript object
		 * @param {HTMLElement} ele - source HTML element
		 * @returns {CSBEImage}
		 */
		save(ele) {
			return {
				type: 'image',
				version,
				meta,
				content: ele.src,
				settings: {
					...this._extractImageSettings(ele),
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
			const img = document.createElement('img')
			img.src = ele.src
			img.tabIndex = 0
			initCommonDataset(img)
			this._initImageDataset(img)
			img.dataset.blocktype = 'image'
			img.dataset.uuid = ele.dataset.uuid
			img.classList.add('csbe-image')
			applyDatasetStyles(img, ele)

			if (ele.dataset.classes !== '') {
				img.dataset.classes = ele.dataset.classes
				ele.dataset.classes.split(' ').forEach(c => img.classList.add(c))
			}

			restoreDatasetSetting(img, ele, 'width', 'width')
			restoreDatasetSetting(img, ele, 'height', 'height')
			restoreDatasetSetting(img, ele, 'maxWidth', 'maxWidth')
			restoreDatasetSetting(img, ele, 'maxHeight', 'maxHeight')

			const align = ele.dataset.align

			if (['start', 'center', 'end'].includes(align)) {
				/** @type {HTMLElement} */
				const wrapper = document.createElement('div')
				wrapper.classList.add('csbe-block')
				wrapper.dataset.wrapper = 'image'
				wrapper.style.display = 'flex'
				wrapper.style.justifyContent = align
				wrapper.appendChild(img)
				return wrapper
			}

			if (align === 'left') img.style.float = 'left'
			if (align === 'right') img.style.float = 'right'

			img.classList.add('csbe-block')
			return img
		}
	}
}
