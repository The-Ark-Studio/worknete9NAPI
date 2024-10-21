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
            path: "/auth/checker/signin",
            handler: "auth.signinChecker",
            config: {
                policies: []
            }
        },
        {
            method: "POST",
            path: "/auth/supporter/signin",
            handler: "auth.signinCustomerSupporter",
            config: {
                policies: []
            }
        }
    ],
};
