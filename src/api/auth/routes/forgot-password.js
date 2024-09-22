module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/auth/forgot-password',
      handler: 'forgot-password.forgotPassword',
      config: {
        auth: false,
      },
    },
  ],
};
