// path: ./api/auth/controllers/auth.js

module.exports = {
    async register(ctx) {
        const { email, phoneNumber, password } = ctx.request.body;

        // Check if all required fields are provided
        if (!email || !password || !phoneNumber) {
            return ctx.send({
                error: true,
                success: false,
                message: 'Email, password, and phone number are required fields',
                data: null,
            }, 400);
        }

        try {
            // Ensure phoneNumber is unique using the correct query syntax for Strapi v4
            const existingPhoneNumber = await strapi.db.query('plugin::users-permissions.user').findOne({
                where: { phoneNumber }
            });

            if (existingPhoneNumber) {
                return ctx.send({
                    error: true,
                    success: false,
                    message: 'Phone number already exists',
                    data: null,
                }, 400);
            }

            // Ensure email is unique using the correct query syntax for Strapi v4
            const existingEmail = await strapi.db.query('plugin::users-permissions.user').findOne({
                where: { email }
            });

            if (existingEmail) {
                return ctx.send({
                    error: true,
                    success: false,
                    message: 'Phone number already exists',
                    data: null,
                }, 400);
            }


            // Register user
            const newUser = await strapi.plugins['users-permissions'].services.user.add({
                email,
                password,
                phoneNumber,
                username: 'userTemp', // Temporary username to satisfy validation
            });

            // Set username as "user" + user ID
            await strapi.db.query('plugin::users-permissions.user').update({
                where: { id: newUser.id },
                data: { username: `user${newUser.id}` }
            });
            // const updatedUser = await strapi.plugins['users-permissions'].services.user.edit(
            //     { id: newUser.id },
            //     { username: `user${newUser.id}` }
            // );

            // Assign default role 'Worker'
            const workerRole = await strapi.db.query('plugin::users-permissions.role').findOne({
                where: { type: 'worker' }
            });

            if (workerRole) {
                await strapi.db.query('plugin::users-permissions.user').update({
                    where: { id: newUser.id },
                    data: { role: workerRole.id },
                });
            }

            // Return the response
            return ctx.send({
                error: false,
                success: true,
                message: 'User registered successfully',
                data: newUser,
            }, 200);

        } catch (err) {
            console.log("Error registration: ", err.message)
            return ctx.send({
                error: true,
                success: false,
                message: 'User registration failed',
                data: err.message,
            }, 500);
        }
    },

    async signin(ctx) {
        const { userId, password, rememberFlag, fcmToken } = ctx.request.body;

        // Kiểm tra nếu phoneNumber và password có được cung cấp
        if (!userId || !password) {
            return ctx.send({
                error: true,
                success: false,
                message: 'Phone number and Password are required.',
                data: null,
            }, 400);
        }

        // Tìm người dùng theo số điện thoại
        const user = await strapi.query('plugin::users-permissions.user').findOne({
            where: {
                phoneNumber: userId,
                status: 'Active',
                blocked: false
            },
            populate: {
                role: {
                    populate: {
                        permissions: true,   // Populate permissions liên quan đến role
                    }
                },
                avatarImg: true         // Populate avatar nếu cần
            }
        });
        // console.log(user.role.permissions)

        if (!user) {
            return ctx.send({
                error: true,
                success: false,
                message: 'User not found.',
                data: null,
            }, 404);
        }

        // Xác thực password
        const validPassword = await strapi.plugins['users-permissions'].services.user.validatePassword(password, user.password);

        if (!validPassword) {
            return ctx.send({
                error: true,
                success: false,
                message: 'Invalid password.',
                data: null,
            }, 400);
        }

        // Tạo token JWT
        const token = strapi.plugins['users-permissions'].services.jwt.issue({ id: user.id });
        const actions = user.role.permissions.map(permission => permission.action);

        // Trả về token và thông tin người dùng
        return ctx.send({
            error: true,
            success: false,
            message: 'Login successfully',
            data: {
                token: token,
                rememberFlag: rememberFlag,
                fcmToken: fcmToken,
                user: {
                    id: user.id,
                    username: user.username,
                    phoneNumber: user.phoneNumber,
                    email: user.email,
                    name: user.name,
                    givenName: user.givenName,
                    gender: user.gender,
                    avatarImg: user.avatarImg.url,
                    role: {
                        name: user.role.name,
                        // permission: actions
                    }
                }
            },
        }, 200);
    },

    async signinChecker(ctx) {
        const { email, password, rememberFlag, fcmToken } = ctx.request.body;

        // Kiểm tra nếu email và password có được cung cấp
        if (!email || !password) {
            return ctx.send({
                error: true,
                success: false,
                message: 'Email and Password are required.',
                data: null,
            }, 400);
        }

        // Tìm người dùng theo số điện thoại
        const user = await strapi.query('plugin::users-permissions.user').findOne({
            where: {
                email: email,
                status: 'Active',
                blocked: false
            },
            populate: {
                role: {
                    populate: {
                        permissions: true,   // Populate permissions liên quan đến role
                    }
                },
                avatarImg: true         // Populate avatar nếu cần
            }
        });

        if (!user) {
            return ctx.send({
                error: true,
                success: false,
                message: 'User not found.',
                data: null,
            }, 404);
        }

        // Xác thực password
        const validPassword = await strapi.plugins['users-permissions'].services.user.validatePassword(password, user.password);

        if (!validPassword) {
            return ctx.send({
                error: true,
                success: false,
                message: 'Invalid password.',
                data: null,
            }, 400);
        }

        // Tạo token JWT
        const token = strapi.plugins['users-permissions'].services.jwt.issue({ id: user.id });
        const actions = user.role.permissions.map(permission => permission.action);

        // Trả về token và thông tin người dùng
        return ctx.send({
            error: true,
            success: false,
            message: 'Login successfully',
            data: {
                token: token,
                rememberFlag: rememberFlag,
                user: {
                    id: user.id,
                    username: user.username,
                    phoneNumber: user.phoneNumber,
                    email: user.email,
                    name: user.name,
                    givenName: user.givenName,
                    gender: user.gender,
                    avatarImg: user.avatarImg.url,
                    role: {
                        name: user.role.name,
                        // permission: actions
                    }
                }
            },
        }, 200);
    },

};
