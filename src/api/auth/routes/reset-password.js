module.exports = {
    routes: [
        {
            method: 'POST',
            path: '/auth/reset-password',
            handler: 'reset-password.resetPassword',
            config: {
                auth: false,
            },
        },
    ],
};
