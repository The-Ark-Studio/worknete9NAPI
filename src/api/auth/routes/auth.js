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
        {
            method: "POST",
            path: "/auth/signin",
            handler: "auth.signin",
            config: {
                policies: []
            }
        },
        {
            method: "POST",
            path: "/auth/admin/signin",
            handler: "auth.signinChecker",
            config: {
                policies: []
            }
        }
    ],
};
