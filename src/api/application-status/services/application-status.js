'use strict';

/**
 * application-status service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::application-status.application-status');
