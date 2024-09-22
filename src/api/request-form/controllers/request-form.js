const { createCoreController } = require('@strapi/strapi').factories;
const { chatRef } = require('../../../../config/firebase'); // Đường dẫn đến file firebase.js

module.exports = createCoreController('api::request-form.request-form', ({ strapi }) => ({
    // Giữ nguyên các phương thức mặc định

    async createRequestForm(ctx) {
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
                    status: 'A',  // Đảm bảo trạng thái là 'A'
                },
                orderBy: { count: 'asc' }, // Tìm supporter có số lượng ít nhất
                populate: ['request_forms'], // Liên kết với request_forms
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

            // Tạo request form với supporter đã chọn
            const newRequestForm = await strapi.db.query('api::request-form.request-form').create({
                data: {
                    headline: headline,
                    description: description,
                    serviceTypeKey: serviceTypeKey,
                    note: '',
                    status: 'O',  // Trạng thái mặc định: 'Open'
                    user: userId,  // Người dùng tạo request
                    supporter: minSupporter.id,  // Supporter với count ít nhất
                    service_type: serviceTypeId,
                    threadId: threadId,  // Thêm thread ID đã tạo
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
            return ctx.send({
                error: true,
                success: false,
                message: 'Failed to create request form',
                data: error.message,
            }, 500);
        }
    }
}));
