// path: src/api/request-form/routes/request-form.js

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = {
    routes: [
        {
            method: 'POST',
            path: '/request-forms/create',
            handler: 'request-form.createRequestForm', // Gọi đến phương thức mới
            config: {
                auth: false, // Cần xác thực hay không
            },
        },
        // Các route khác nếu có
    ],
};
