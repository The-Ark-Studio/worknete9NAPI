'use strict';

/**
 * application-status router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::application-status.application-status');
