/**
 * @typedef {Object} CSBEBlockMeta
 * @property {String} author - author of the block
 * @property {String} description - description of the block
 */

/**
 * @typedef {Object} CSBEBlockPropertyValue
 * @property {String} value - value to set in the property's dataset
 * @property {String} text - text to display for the value
 * @property {String} icon - SVG to display for the value
 */

/**
 * @typedef {Object} CSBEBlockProperty
 * @property {String} name - name of the property
 * @property {String} slug - slug for the property used in HTML element dataset
 * @property {CSBEBlockPropertyValue[]} [values] - array of property values
 * @property {Boolean} [toolbar] - true if property should also appear in the toolbar
 */

/**
 * @typedef {Object} CSBEBlock
 * @property {String} name - name of the block
 * @property {String} slug - slug for the block for lookups
 * @property {String} icon - SVG for the block's icon
 * @property {String} class - CSS class for the block
 * @property {String[]} pasteSupport - array of HTML element types the block supports during a clipboard paste
 * @property {Boolean} allowMerge - whether the block type supports merging during deletion events
 * @property {Object} config - configuration options for the block type
 * @property {String} version - version number of the block type
 * @property {CSBEBlockMeta} - meta information for the block type
 * @property {CSBEBlockProperty[]} [properties] - array of extra properties for the block
 * @property {Function} clone - function to create a clone of the block
 * @property {Function} create - function to create a new instance of the block
 * @property {Function} isEmpty - function to check if a block is devoid of content or customization
 * @property {Function} load - function to load a block from a definition and return a rendered HTML element
 * @property {Function} paste -function to convert clipboard HTML to a block
 * @property {Function} render -function to render a block as HTML
 * @property {Function} save - function to convert the HTML element back into a Object
 * @property {Function} update - function to convert the HTML element back into a Object
 */

/**
 * @typedef {Object} CSBEBlockData
 * @property {String} name - name of the block
 * @property {String} version - version number of the block
 * @property {CSBEBlockMeta} meta - meta for the block
 * @property {String} content - content of the block
 * @property {Object} settings - settings for the block
 */

/**
 * @typedef {String} CSBESchemaID
 * A string identifying the block schema version, e.g. "csbe-blocks-0.1"
 */

/**
 * @typedef {Object} CSBEDocument
 * @property {String} type - MIME type
 * @property {String} version - CSBE version
 * @property {CSBESchemaID} schema - CSBE block schema identifier
 * @property {CSBEBlockData[]} blocks - document blocks
 */
