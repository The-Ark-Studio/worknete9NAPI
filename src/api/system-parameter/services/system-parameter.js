'use strict';

/**
 * system-parameter service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::system-parameter.system-parameter');
