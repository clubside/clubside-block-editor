// /src/core/common.js (ESM)

const COMMON_DATASET_FIELDS = [
	'uuid',
	'id',
	'classes',
	'padding', 'paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom',
	'margin', 'marginLeft', 'marginRight', 'marginTop', 'marginBottom',
	'parent', 'children', 'locked'
]

/**
 * Apply id, padding and margin common properties to an HTML element based on the dataset values of another HTML element
 * @param {HTMLElement} target - destination element
 * @param {HTMLElement} source - source element
 * @returns {HTMLElement}
 */
export function applyDatasetStyles(target, source) {
	if (source.dataset.padding !== '') target.style.padding = source.dataset.padding
	else {
		if (source.dataset.paddingLeft !== '') target.style.paddingLeft = source.dataset.paddingLeft
		if (source.dataset.paddingRight !== '') target.style.paddingRight = source.dataset.paddingRight
		if (source.dataset.paddingTop !== '') target.style.paddingTop = source.dataset.paddingTop
		if (source.dataset.paddingBottom !== '') target.style.paddingBottom = source.dataset.paddingBottom
	}

	if (source.dataset.margin !== '') target.style.margin = source.dataset.margin
	else {
		if (source.dataset.marginLeft !== '') target.style.marginLeft = source.dataset.marginLeft
		if (source.dataset.marginRight !== '') target.style.marginRight = source.dataset.marginRight
		if (source.dataset.marginTop !== '') target.style.marginTop = source.dataset.marginTop
		if (source.dataset.marginBottom !== '') target.style.marginBottom = source.dataset.marginBottom
	}

	if (source.dataset.id !== '') target.id = source.dataset.id

	return target
}

/**
 * Apply id, padding and margin common properties to an HTML element based on the settings values of a block
 * @param {HTMLElement} target - destination element
 * @param {Object} block - source block
 * @returns {HTMLElement}
 */
export function applySettingsStyles(target, block) {
	const s = block.settings

	if (s.padding) target.style.padding = s.padding
	else {
		if (s.paddingLeft) target.style.paddingLeft = s.paddingLeft
		if (s.paddingRight) target.style.paddingRight = s.paddingRight
		if (s.paddingTop) target.style.paddingTop = s.paddingTop
		if (s.paddingBottom) target.style.paddingBottom = s.paddingBottom
	}

	if (s.margin) target.style.margin = s.margin
	else {
		if (s.marginLeft) target.style.marginLeft = s.marginLeft
		if (s.marginRight) target.style.marginRight = s.marginRight
		if (s.marginTop) target.style.marginTop = s.marginTop
		if (s.marginBottom) target.style.marginBottom = s.marginBottom
	}

	if (s.id) target.id = s.id

	return target
}

/**
 * Check id, padding and margin common properties for customization
 * @param {Object} block - source block
 * @returns {Boolean}
 */
export function checkSettingsStyles(block) {
	const s = block.settings

	if (s.padding) return false
	else {
		if (s.paddingLeft) return false
		if (s.paddingRight) return false
		if (s.paddingTop) return false
		if (s.paddingBottom) return false
	}

	if (s.margin) return false
	else {
		if (s.marginLeft) return false
		if (s.marginRight) return false
		if (s.marginTop) return false
		if (s.marginBottom) return false
	}

	if (s.id) return false

	return true
}

/**
 * Convert common dataset property values into object for saving with other block settings
 * @param {HTMLElement} ele - source HTML element
 * @returns {Object}
 */
export function extractCommonSettings(ele) {
	const settings = {}
	for (const field of COMMON_DATASET_FIELDS) {
		if (ele.dataset[field] !== '') settings[field] = ele.dataset[field]
	}
	return settings
}

/**
 * Generate a unique identifier
 * @returns {String}
 */
export function generateId() {
	if (crypto.randomUUID) {
		return crypto.randomUUID()
	}

	// fallback for older browsers
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
		const r = crypto.getRandomValues(new Uint8Array(1))[0] & 15
		const v = c === 'x' ? r : (r & 0x3 | 0x8)
		return v.toString(16)
	})
}

/**
 * Initialize common dataset properties on an HTML element
 * @param {HTMLElement} ele - source HTML element
 */
export function initCommonDataset(ele) {
	for (const field of COMMON_DATASET_FIELDS) {
		ele.dataset[field] = ''
	}
}

/**
 * Set a specific HTML element style property based on its source block setting
 * @param {HTMLElement} target - HTML element to modify
 * @param {Object} block - block definition
 * @param {String} style - JavaScript version of CSS property
 * @param {String} setting - setting name
 * @param {Boolean} [renderOnly] - if true do not set dataset value
 */
export function restoreBlockSetting(target, block, style, setting, renderOnly) {
	if (block.settings[setting]) {
		if (renderOnly !== true) target.dataset[setting] = block.settings[setting]
		target.style[style] = block.settings[setting]
	}
}

/**
 * Set a specific HTML element style property based on another HTML element
 * @param {HTMLElement} target - HTML element to modify
 * @param {HTMLElement} ele - HTML element source
 * @param {String} style - JavaScript version of CSS property
 * @param {String} setting - setting name
 */
export function restoreDatasetSetting(target, ele, style, setting) {
	if (ele.dataset[setting]) {
		target.dataset[setting] = ele.dataset[setting]
		target.style[style] = ele.dataset[setting]
	}
}
