const bcrypt = require('bcryptjs');
// const strapi = require('@strapi/strapi');

module.exports = {
    async resetPassword(ctx) {
        const { password, token } = ctx.request.body;

        if (!password || !token) {
            // return ctx.badRequest('Mật khẩu và token không được để trống');
            return ctx.send({
                error: true,
                success: false,
                message: 'Password and Token are required.',
                data: null,
            }, 400);
        }

        // Kiểm tra tính hợp lệ của token và tìm người dùng
        const user = await strapi.query('plugin::users-permissions.user').findOne({
            where: { resetPasswordToken: token },
        });

        if (!user) {
            // return ctx.badRequest('Token không hợp lệ hoặc đã hết hạn');
            return ctx.send({
                error: true,
                success: false,
                message: 'Token is invalid or expired.',
                data: null,
            }, 400);
        }
        try {
            // Mã hoá mật khẩu mới
            const hashedPassword = await bcrypt.hash(password, 10);

            // Cập nhật mật khẩu mới và xoá token
            await strapi.query('plugin::users-permissions.user').update({
                where: { id: user.id },
                data: { password: hashedPassword, resetPasswordToken: null },
            });

            // ctx.send({ message: 'Mật khẩu đã được đặt lại thành công' });

            // Gửi email xác nhận mật khẩu đã thay đổi
            await strapi.plugin('email').services.email.send({
                to: user.email,
                subject: 'Mật khẩu đã được thay đổi',
                html: '<p>Mật khẩu của bạn đã được thay đổi thành công.</p>',
            });

            return ctx.send({
                error: true,
                success: false,
                message: 'Reset password succeed.',
                data: null,
            }, 200);
        } catch (err) {
            console.log("Error Reset password: ", err.message)
            return ctx.send({
                error: true,
                success: false,
                message: 'Reset password failed.',
                data: err.message,
            }, 500);
        }


    },
};
