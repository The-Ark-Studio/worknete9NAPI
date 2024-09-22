'use strict';

/**
 * request-form service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::request-form.request-form');
