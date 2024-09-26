'use strict';

/**
 * prefer-work service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::prefer-work.prefer-work');
