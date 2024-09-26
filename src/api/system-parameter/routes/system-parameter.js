'use strict';

/**
 * system-parameter router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::system-parameter.system-parameter');
