'use strict';

/**
 *  application-configuration controller
 */

module.exports = {
    async find(ctx) {
        // const
        const applicationStatuses = await strapi.db.query('api::application-status.application-status').findMany({
            select: ['statusType', 'name', 'locale']
        });

        const genders = await strapi.db.query('api::gender.gender').findMany({
            select: ['key', 'name', 'locale'],  // Chọn các trường bạn muốn lấy 
        });

        const academicBackgrounds = await strapi.db.query('api::education.education').findMany({
            select: ['key', 'name', 'locale'],
        });

        const familySituations = await strapi.db.query('api::family-situation.family-situation').findMany({
            select: ['key', 'name', 'locale'],
        });

        const preferredWorks = await strapi.db.query('api::prefer-work.prefer-work').findMany({
            select: ['key', 'name', 'locale'],
        });

        // Trả về dữ liệu
        return ctx.send({
            error: false,
            success: true,
            message: 'Get all application configuration successfully',
            data: {
                applicationStatuses,
                genders,
                academicBackgrounds,
                familySituations,
                preferredWorks
            },
        }, 200);
    },
};
