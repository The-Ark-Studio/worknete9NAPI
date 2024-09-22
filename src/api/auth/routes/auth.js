module.exports = {
    routes: [
        {
            method: 'POST',
            path: '/auth/register',
            handler: 'auth.register',
            config: {
                auth: false,
                policies: []
            },
        },
    ],
};
