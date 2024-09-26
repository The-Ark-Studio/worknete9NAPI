'use strict';

/**
 * application-status controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::application-status.application-status');
