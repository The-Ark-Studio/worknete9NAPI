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
                    serviceTypeKey: serviceTypeKey,
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
    }
}));
