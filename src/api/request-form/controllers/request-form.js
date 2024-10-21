const { createCoreController } = require('@strapi/strapi').factories;
const { chatRef } = require('../../../../config/firebase'); // Đường dẫn đến file firebase.js

const formatDateForIDCode = () => {
    // Lấy ngày hiện tại (current date)
    const date = new Date();
    const prefix = process.env.E9_PREFIX_UID;
    // Lấy giờ UTC
    const hours = String(date.getUTCHours()).padStart(2, '0');

    // Các phần khác giữ nguyên
    const year = date.getUTCFullYear();
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const month = monthNames[date.getUTCMonth()];
    const day = String(date.getUTCDate()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');

    return `${prefix}-${year}${month}${day}-${hours}${minutes}`;
};

module.exports = createCoreController('api::request-form.request-form', ({ strapi }) => ({
    // Giữ nguyên các phương thức mặc định

    async create(ctx) {
        const { headline, description, serviceTypeKey, userId } = ctx.request.body;

        try {

            // Kiểm tra valid user
            const existUser = await strapi.db.query('plugin::users-permissions.user').findOne({ where: { id: userId } })

            if (!existUser) {
                console.log('User is not found')
                return ctx.send({
                    error: true,
                    success: false,
                    message: 'User is invalid or not exist.',
                    data: null,
                }, 404);
            }

            // Tìm service type id
            const serviceTypeId = await strapi.db.query('api::service-type.service-type').findOne({ where: { serviceTypeKey } })

            if (!serviceTypeId) {
                console.log('Service type is not found')
                return ctx.send({
                    error: true,
                    success: false,
                    message: 'Service Type is invalid or not exist.',
                    data: null,
                }, 404);
            }

            // Tìm supporter có ít count nhất, role là 'Supporter' và status là 'A'
            const minSupporter = await strapi.db.query('plugin::users-permissions.user').findOne({
                where: {
                    role: { type: 'supporter' },  // Đảm bảo role là 'Supporter'
                    status: 'Active',  // Đảm bảo trạng thái là 'A'
                },
                orderBy: { count: 'asc' }, // Tìm supporter có số lượng ít nhất
                populate: ['request_forms'], // Liên kết với request_forms
                limit: 1,
            });

            if (!minSupporter) {
                return ctx.send({
                    error: true,
                    success: false,
                    message: 'No Supporter actives.',
                    data: null,
                }, 404);
            }

            // Tạo một threadId duy nhất (UUID hoặc timestamp đơn giản)
            const threadId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const requestFormId = formatDateForIDCode();

            // Tạo request form với supporter đã chọn
            const newRequestForm = await strapi.db.query('api::request-form.request-form').create({
                data: {
                    requestFormId: requestFormId,
                    headline: headline,
                    description: description,
                    // serviceTypeKey: serviceTypeKey,
                    note: '',
                    status: 'Open',  // Trạng thái mặc định: 'Open'
                    user: userId,  // Người dùng tạo request
                    supporter: minSupporter.id,  // Supporter với count ít nhất
                    service_type: serviceTypeId,
                    threadId: threadId,  // Thêm thread ID đã tạo,
                    publishedAt: new Date()
                }
            });

            // Tạo phòng chat trong Firebase
            const chatRoom = chatRef.push();
            await chatRoom.set({
                threadId,
                userId,
                supporterId: minSupporter.id,
                messages: [
                    {
                        text: `${headline} - ${description}`, // Tin nhắn đầu tiên từ hệ thống
                        timestamp: Date.now(),
                        from: 'system', // Đánh dấu tin nhắn từ hệ thống
                    },
                ],
            });

            // Cập nhật count cho checker đã chọn
            await strapi.db.query('plugin::users-permissions.user').update({
                where: { id: minSupporter.id },
                data: {
                    count: minSupporter.count + 1, // Tăng count lên 1
                },
            });

            // Gửi email sau khi cập nhật thành công
            await strapi.plugins['email'].services.email.send({
                to: existUser.email,  // Gửi tới email của Checker
                subject: 'Requested Form Created',
                text: `The requested form has been created with ID ${newRequestForm.id} `,
                html: `<p>The requested form has been created: <strong>${process.env.FRONTEND_URL}</strong></p>`,
            });

            // Trả về dữ liệu và URL phòng chat
            return ctx.send({
                error: false,
                success: true,
                message: 'Request form created successfully and chat room initialized',
                data: {
                    requestForm: newRequestForm,
                    chatRoomId: chatRoom.key,
                    chatRoomUrl: `https://your-chat-service-url.com/chat/${chatRoom.key}`,
                },
            }, 201);
        } catch (error) {
            const errorsArray = [];

            // Kiểm tra nếu có nhiều lỗi trong error.details
            if (error.details && error.details.errors) {
                error.details.errors.forEach((err) => {
                    // Thêm thông tin lỗi vào mảng
                    errorsArray.push({
                        message: err.message,
                        path: err.path || [] // Đường dẫn đến trường bị lỗi (nếu có)
                    });
                });
            } else {
                // Nếu không có thông tin chi tiết, thêm lỗi chung
                errorsArray.push({ message: error.message });
            }

            // Trả về phản hồi chứa các lỗi
            return ctx.send({
                error: true,
                success: false,
                message: 'Failed to create request form',
                data: errorsArray // Gửi mảng lỗi
            }, 500);
        }
    },

    async find(ctx) {
        try {
            // Lấy locale từ request query
            const { locale = 'en' } = ctx.query;
            // console.log(locale)
            // Lấy token từ header Authorization và parse để lấy userId
            const token = ctx.request.header.authorization.split(' ')[1];
            const decodedToken = await strapi.plugins['users-permissions'].services.jwt.verify(token);
            const userId = decodedToken.id;

            // Tìm kiếm thông tin người dùng để lấy role
            const user = await strapi.query('plugin::users-permissions.user').findOne({
                where: { id: userId },
                populate: ['role']
            });

            let requestForms;

            if (user.role.type === 'supporter') {
                // Supporter: trả về danh sách đơn mà Supporter được gán
                requestForms = await strapi.entityService.findMany('api::request-form.request-form', {
                    filters: { supporter: userId },
                    locale,
                    populate: {
                        serviceType: {
                            fields: ['serviceTypeKey']
                        },
                        user: {
                            fields: ['phoneNumber']
                        },
                    }
                });
            } else if (user.role.type === 'worker') {
                // Worker: trả về danh sách đơn mà Worker đã tạo
                requestForms = await strapi.entityService.findMany('api::request-form.request-form', {
                    filters: { user: userId },
                    populate: {
                        serviceType: {
                            fields: ['serviceTypeKey']
                        },
                        user: {
                            fields: ['phoneNumber']
                        },
                    }
                });
            } else if (user.role.type === 'admin') {
                // Worker: trả về danh sách đơn mà Worker đã tạo
                requestForms = await strapi.entityService.findMany('api::request-form.request-form',
                    {
                        locale,
                        populate: {
                            serviceType: {
                                fields: ['serviceTypeKey']
                            },
                            user: {
                                fields: ['phoneNumber']
                            },
                        }
                    }
                );
            } else {
                return ctx.send({
                    error: true,
                    success: false,
                    message: 'Unauthorized access',
                }, 401);
            }

            // Trả về dữ liệu
            return ctx.send({
                error: false,
                success: true,
                message: 'Get all request forms successfully',
                data: requestForms,
            }, 200);
        } catch (error) {
            const errorsArray = [];

            // Kiểm tra nếu có nhiều lỗi trong error.details
            if (error.details && error.details.errors) {
                error.details.errors.forEach((err) => {
                    // Thêm thông tin lỗi vào mảng
                    errorsArray.push({
                        message: err.message,
                        path: err.path || [] // Đường dẫn đến trường bị lỗi (nếu có)
                    });
                });
            } else {
                // Nếu không có thông tin chi tiết, thêm lỗi chung
                errorsArray.push({ message: error.message });
            }

            // Trả về phản hồi chứa các lỗi
            return ctx.send({
                error: true,
                success: false,
                message: 'Failed to get applications',
                data: errorsArray // Gửi mảng lỗi
            }, 500);
        }
    },

    async findOne(ctx) {
        await this.validateQuery(ctx);
        try {
            const { id } = ctx.params; // Lấy id của Application từ request params
            const token = ctx.request.header.authorization.split(' ')[1];
            const decodedToken = await strapi.plugins['users-permissions'].services.jwt.verify(token);
            const userId = decodedToken.id;

            // Lấy thông tin đơn theo ID
            const requestForm = await strapi.entityService.findOne(
                'api::request-form.request-form',
                id,
                {
                    populate: {
                        supporter: {
                            fields: ['phoneNumber']
                        }, user: {
                            fields: ['phoneNumber']
                        },
                    }, // Populate để lấy các quan hệ nếu cần
                }
            );

            if (!requestForm) {
                return ctx.send({
                    error: true,
                    success: false,
                    message: 'Request Form not founds',
                }, 404);
            }

            // Tìm kiếm thông tin người dùng để lấy role
            const user = await strapi.entityService.findOne('plugin::users-permissions.user', userId, {
                populate: ['role'],
            });

            if (
                (user.role.type === 'supporter' && requestForm.supporter.id === userId) ||
                (user.role.type === 'worker' && requestForm.user.id === userId)
            ) {
                // Chỉ lấy thông tin cần thiết từ checker
                const checkerInfo = {
                    email: requestForm.supporter.email,
                    phoneNumber: requestForm.supporter.phoneNumber,
                    name: requestForm.supporter.name,
                    givenName: requestForm.supporter.givenName,
                    companyName: requestForm.supporter.companyName,
                    location: requestForm.supporter.location,
                    establishYear: requestForm.supporter.establishYear,
                };
                // Sanitize thông tin
                const sanitizedApplication = await this.sanitizeOutput(requestForm, ctx);


                // Trả về dữ liệu
                return ctx.send({
                    error: false,
                    success: true,
                    message: 'Get request form successfully',
                    data: {
                        requestForm: {
                            ...sanitizedApplication,
                            supporter: checkerInfo
                        }
                    },
                }, 200);
            } else {
                return ctx.send({
                    error: true,
                    success: false,
                    message: 'Unauthorized access',
                }, 401);
            }
        } catch (error) {
            const errorsArray = [];

            // Kiểm tra nếu có nhiều lỗi trong error.details
            if (error.details && error.details.errors) {
                error.details.errors.forEach((err) => {
                    // Thêm thông tin lỗi vào mảng
                    errorsArray.push({
                        message: err.message,
                        path: err.path || [] // Đường dẫn đến trường bị lỗi (nếu có)
                    });
                });
            } else {
                // Nếu không có thông tin chi tiết, thêm lỗi chung
                errorsArray.push({ message: error.message });
            }

            // Trả về phản hồi chứa các lỗi
            return ctx.send({
                error: true,
                success: false,
                message: 'Failed to get applications',
                data: errorsArray // Gửi mảng lỗi
            }, 500);
        }
    },

    async update(ctx) {
        // Xác thực dữ liệu đầu vào
        await this.validateQuery(ctx); // Xác thực dữ liệu trong yêu cầu
        try {
            const defaultLocale = 'en';
            const { id } = ctx.params; // Lấy id của Application từ request params
            const token = ctx.request.header.authorization.split(' ')[1];
            const decodedToken = await strapi.plugins['users-permissions'].services.jwt.verify(token);
            const userId = decodedToken.id;

            // Tìm kiếm thông tin người dùng để lấy role
            const user = await strapi.query('plugin::users-permissions.user').findOne({
                where: { id: userId },
                populate: ['role']
            });

            if (user.role.type !== 'checker') {
                return ctx.send({
                    error: true,
                    success: false,
                    message: 'Only Checkers can update applications',
                }, 401);
            }

            // Lấy thông tin đơn theo ID
            const application = await strapi.entityService.findOne(
                'api::request-form.request-form',
                id,
                {
                    populate: { checker: true, user: true }, // Populate để lấy các quan hệ nếu cần
                }
            );

            if (!application) {
                return ctx.send({
                    error: true,
                    success: false,
                    message: 'Application not founds',
                }, 404);
            }

            // Chỉ Checker được gán ứng dụng này mới có quyền cập nhật
            if (application.checker.id !== userId) {
                return ctx.send({
                    error: true,
                    success: false,
                    message: 'You are not assigned to this application',
                }, 401);
            }

            // Chỉ cập nhật các field status và note
            const { status, note } = ctx.request.body;

            // Tìm application status
            const existApplicationStatus = await strapi.db.query('api::application-status.application-status').findOne({ where: { statusType: status, locale: defaultLocale } })

            if (!existApplicationStatus) {
                console.log('Application status is not found')
                return ctx.send({
                    error: true,
                    success: false,
                    message: 'Application status is invalid or not exist.',
                    data: null,
                }, 404);
            }

            // Cập nhật ứng dụng
            const updatedApplication = await strapi.entityService.update(
                'api::request-form.request-form',
                id,
                {
                    data: {
                        application_status: existApplicationStatus.id,
                        note
                    }
                }
            );

            // Gửi email sau khi cập nhật thành công
            await strapi.plugins['email'].services.email.send({
                to: application.user.email,  // Gửi tới email của Checker
                subject: 'Application Updated',
                text: `The application with ID ${application.applicationOrder} has been updated`,
                html: `<p>The application with ID <strong>${application.applicationOrder}</strong> has been updated to status: <strong>${process.env.FRONTEND_URL}</strong></p>`,
            });

            return ctx.send({
                error: false,
                success: true,
                message: 'Get application successfully',
                data: {
                    updatedApplication
                },
            }, 200);;
        } catch (error) {
            const errorsArray = [];

            // Kiểm tra nếu có nhiều lỗi trong error.details
            if (error.details && error.details.errors) {
                error.details.errors.forEach((err) => {
                    // Thêm thông tin lỗi vào mảng
                    errorsArray.push({
                        message: err.message,
                        path: err.path || [] // Đường dẫn đến trường bị lỗi (nếu có)
                    });
                });
            } else {
                // Nếu không có thông tin chi tiết, thêm lỗi chung
                errorsArray.push({ message: error.message });
            }

            // Trả về phản hồi chứa các lỗi
            return ctx.send({
                error: true,
                success: false,
                message: 'Unable to update application',
                data: errorsArray // Gửi mảng lỗi
            }, 500);
        }
    }
}));
