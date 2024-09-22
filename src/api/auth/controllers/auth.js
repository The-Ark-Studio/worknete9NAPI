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
};
