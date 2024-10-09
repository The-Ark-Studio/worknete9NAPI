'use strict';

module.exports = {
    routes: [
        {
            method: 'GET',
            path: '/application-configuration',
            handler: 'application-configuration.find',
            config: {
                policies: [],
                middlewares: [],
            },
        },
    ],
};
