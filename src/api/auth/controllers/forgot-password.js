
module.exports = {
    async forgotPassword(ctx) {
        const { email, phoneNumber } = ctx.request.body;

        if (!email || !phoneNumber) {
            // return ctx.badRequest('Email và số điện thoại không được để trống');
            return ctx.send({
                error: true,
                success: false,
                message: 'Email and Phone number are required.',
                data: null,
            }, 400);
        }

        // Tìm người dùng dựa trên email và số điện thoại
        const user = await strapi.query('plugin::users-permissions.user').findOne({
            where: { email, phoneNumber },
        });

        if (!user) {
            // return ctx.badRequest('Người dùng không tồn tại hoặc thông tin không chính xác');
            return ctx.send({
                error: true,
                success: false,
                message: 'Email or Phone number is not correct.',
                data: null,
            }, 400);
        }
        try {
            // Tạo resetPasswordToken và lưu vào user
            const resetToken = strapi.plugin('users-permissions').services.jwt.issue({ id: user.id }, { expiresIn: '60m' });
            await strapi.query('plugin::users-permissions.user').update({
                where: { id: user.id },
                data: { resetPasswordToken: resetToken },
            });

            // Gửi email reset mật khẩu
            const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
            // await strapi.plugin('email').services.email.send({
            //     to: user.email,
            //     subject: 'Reset mật khẩu của bạn',
            //     html: `<p>Click vào link dưới đây để reset mật khẩu của bạn:</p><a href="${resetUrl}">${resetUrl}</a>`,
            // });
            await strapi.plugins['email'].services.email.sendTemplatedEmail(
                {
                    to: user.email,  // Email của người nhận
                },
                {
                    template: 'resetPassword',  // Template resetPassword đã định nghĩa
                    // subject: 'Reset your password', // Tiêu đề email
                },
                {
                    URL: process.env.FRONTEND_URL,
                    TOKEN: resetToken,  // Token để reset password
                }
            );

            // ctx.send({ message: 'Email reset mật khẩu đã được gửi' });
            return ctx.send({
                error: false,
                success: true,
                message: 'Email reset password has been sent.',
                data: null,
            }, 200);
        } catch (err) {
            console.log("Error Forgot password: ", err.message)
            return ctx.send({
                error: true,
                success: false,
                message: 'Forgot password failed.',
                data: err.message,
            }, 500);
        }

    },
};
