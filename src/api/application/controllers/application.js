'use strict';

/**
 * application controller
 */
'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const cloudinary = require('cloudinary').v2;
const axios = require('axios');
const { sanitize } = require("@strapi/utils");


// Cấu hình Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = createCoreController('api::application.application', ({ strapi }) => ({
    async create(ctx) {
        const defaultLocale = 'en';
        const { user, gender, age, professionalTitle, homeTown, expectedSalary, preferredWork, academicBackground, expectedArea, familySituation, numberOfFamily, status, transactionId } = ctx.request.body;
        const { passportImg, healthCheckImg, policeCheckImg, koreanExamImg, idCardFrontImg, idCardBackImg } = ctx.request.files;
        // console.log(ctx.request.body)
        // console.log('Uploaded Files:', ctx.request.files);
        try {
            // Kiểm tra valid user
            const existUser = await strapi.db.query('plugin::users-permissions.user').findOne({ where: { id: user } })

            if (!existUser) {
                console.log('User is not found')
                return ctx.send({
                    error: true,
                    success: false,
                    message: 'User is invalid or not exist.',
                    data: null,
                }, 404);
            }

            // Kiểm tra Transaction ID
            const isValidTransaction = await checkTransactionId(transactionId);
            if (!isValidTransaction) {
                return ctx.send({
                    error: true,
                    success: false,
                    message: 'Invalid transaction ID',
                }, 400);
            }

            // Tìm gender
            const existGender = await strapi.db.query('api::gender.gender').findOne({ where: { key: gender, locale: defaultLocale } })

            if (!existGender) {
                console.log('Gender is not found')
                return ctx.send({
                    error: true,
                    success: false,
                    message: 'Gender is invalid or not exist.',
                    data: null,
                }, 404);
            }

            // Tìm prefer work
            const existPreferredWork = await strapi.db.query('api::prefer-work.prefer-work').findOne({ where: { key: preferredWork, locale: defaultLocale } })

            if (!existPreferredWork) {
                console.log('Prefer work is not found')
                return ctx.send({
                    error: true,
                    success: false,
                    message: 'Prefer work is invalid or not exist.',
                    data: null,
                }, 404);
            }

            // Tìm education
            const existEducation = await strapi.db.query('api::education.education').findOne({ where: { key: academicBackground, locale: defaultLocale } })

            if (!existEducation) {
                console.log('Education is not found')
                return ctx.send({
                    error: true,
                    success: false,
                    message: 'Education is invalid or not exist.',
                    data: null,
                }, 404);
            }

            // Tìm Family situation
            const existFamilySituation = await strapi.db.query('api::family-situation.family-situation').findOne({ where: { key: familySituation, locale: defaultLocale } })

            if (!existFamilySituation) {
                console.log('Family situation is not found')
                return ctx.send({
                    error: true,
                    success: false,
                    message: 'Family situation is invalid or not exist.',
                    data: null,
                }, 404);
            }


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

            // Tìm checker có ít count nhất, role là 'Checker' và status là 'A'
            const minChecker = await strapi.db.query('plugin::users-permissions.user').findOne({
                where: {
                    role: { type: 'checker' },  // Đảm bảo role là 'Checker'
                    status: 'Active',  // Đảm bảo trạng thái là 'A'
                },
                orderBy: { count: 'asc' }, // Tìm checker có số lượng ít nhất
                populate: ['applications'], // Liên kết với applications
                limit: 1
            });

            if (!minChecker) {
                return ctx.send({
                    error: true,
                    success: false,
                    message: 'No Checker actives.',
                    data: null,
                }, 404);
            }

            // Tìm checker có ít count nhất, role là 'Checker' và status là 'A'
            const systemParameter = await strapi.db.query('api::system-parameter.system-parameter').findOne({
                where: { id: 1 }
            });

            const applicationId = user + " - " + transactionId; // Dùng transactionId hoặc userId làm ID ứng dụng

            // Upload hình ảnh lên Cloudinary với các thư mục tương ứng
            const uploadImage = async (file, cloudinaryFolder, strapiFolderId, fileName) => {
                try {
                    const uploadResponse = await strapi.plugins.upload.services.upload.upload({
                        data: {
                            fileInfo: {
                                name: fileName,       // Tên tệp
                                folder: strapiFolderId, // folderId của Strapi
                            },
                            folder: cloudinaryFolder,
                        },
                        files: file
                    });

                    return uploadResponse;
                } catch (error) {
                    console.error('Error uploading file:', error);
                    return ctx.send({
                        error: true,
                        success: false,
                        message: 'File upload failed.',
                        data: null,
                    }, 404);
                    //   throw new Error('File upload failed');
                }
            };
            // const uploadImage = async (file, folder, folderId, fileName) => {
            //     // return await cloudinary.uploader.upload(file.path, {
            //     //     folder: folder,
            //     // });
            // };

            // Tạo đường dẫn thư mục cho từng loại hình ảnh
            const idCardFrontImgUpload = await uploadImage(idCardFrontImg, `Applications/ID Card/${applicationId}`, systemParameter.idCardFrontFolderId, applicationId);

            const idCardBackImgUpload = await uploadImage(idCardBackImg, `Applications/ID Card/${applicationId}`, systemParameter.idCardBackFolderId, applicationId);

            const healthCheckImgUpload = await Promise.all(
                healthCheckImg.map((file, index) => uploadImage(file, `Applications/Health Check/${applicationId}`, systemParameter.healthCheckFolderId, applicationId + " - " + index))
            );

            const policeCheckImgUpload = await uploadImage(policeCheckImg, `Applications/Police Check/${applicationId}`, systemParameter.policeCheckFolderId, applicationId);

            const koreanExamImgUpload = await uploadImage(koreanExamImg, `Applications/Korean Exam/${applicationId}`, systemParameter.koreanExamFolderId, applicationId);

            const passportImgUpload = await uploadImage(passportImg, `Applications/Passport/${applicationId}`, systemParameter.passportFolderId, applicationId);


            // Sau khi upload xong, lưu đường dẫn vào database
            const applicationData = {
                user: user,
                gender: existGender.id,
                age: age,
                professionalTitle: professionalTitle,
                homeTown: homeTown,
                expectedSalary: expectedSalary,
                prefer_work: existPreferredWork.id,
                education: existEducation.id,
                expectedArea: expectedArea,
                family_situation: existFamilySituation.id,
                numberOfFamily: numberOfFamily,
                application_status: existApplicationStatus.id,
                transactionId: transactionId,
                idCardFrontImg: idCardFrontImgUpload[0].id,
                idCardBackImg: idCardBackImgUpload[0].id,
                healthCheckImg: healthCheckImgUpload.map((img) => img[0].id),
                policeCheckImg: policeCheckImgUpload[0].id,
                koreanExamImg: koreanExamImgUpload[0].id,
                passportImg: passportImgUpload[0].id,
                checker: minChecker.id, // Gán checkerId vào dữ liệu hồ sơ
            };

            // Lưu dữ liệu vào Strapi
            const response = await strapi.service('api::application.application').create({ data: applicationData });

            // Cập nhật count cho checker đã chọn
            await strapi.db.query('plugin::users-permissions.user').update({
                where: { id: minChecker.id },
                data: {
                    count: minChecker.count + 1, // Tăng count lên 1
                },
            });

            // Gửi email sau khi cập nhật thành công
            await strapi.plugins['email'].services.email.send({
                to: existUser.email,  // Gửi tới email của Checker
                subject: 'Application Created',
                text: `The application has been created with ID ${response.id} `,
                html: `<p>The application has been created: <strong>${process.env.FRONTEND_URL}</strong></p>`,
            });

            // Trả về dữ liệu và URL phòng chat
            return ctx.send({
                error: false,
                success: true,
                message: 'Add application successfully',
                data: {
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
                message: 'Failed to create application',
                data: errorsArray // Gửi mảng lỗi
            }, 500);
        }
    },

    async find(ctx) {
        try {
            // Lấy token từ header Authorization và parse để lấy userId
            const token = ctx.request.header.authorization.split(' ')[1];
            const decodedToken = await strapi.plugins['users-permissions'].services.jwt.verify(token);
            const userId = decodedToken.id;

            // Tìm kiếm thông tin người dùng để lấy role
            const user = await strapi.query('plugin::users-permissions.user').findOne({
                where: { id: userId },
                populate: ['role']
            });

            let applications;

            if (user.role.type === 'checker') {
                // Checker: trả về danh sách đơn mà Checker được gán
                applications = await strapi.entityService.findMany('api::application.application', {
                    filters: { checker: userId }
                });
            } else if (user.role.type === 'worker') {
                // Worker: trả về danh sách đơn mà Worker đã tạo
                applications = await strapi.entityService.findMany('api::application.application', {
                    filters: { user: userId }
                });
            } else if (user.role.type === 'admin') {
                // Worker: trả về danh sách đơn mà Worker đã tạo
                applications = await strapi.entityService.findMany('api::application.application');
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
                message: 'Get all application successfully',
                data: { applications },
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
            const application = await strapi.entityService.findOne(
                'api::application.application',
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

            // Tìm kiếm thông tin người dùng để lấy role
            const user = await strapi.entityService.findOne('plugin::users-permissions.user', userId, {
                populate: ['role'],
            });

            if (
                (user.role.type === 'checker' && application.checker.id === userId) ||
                (user.role.type === 'worker' && application.user.id === userId)
            ) {
                // Chỉ lấy thông tin cần thiết từ checker
                const checkerInfo = {
                    email: application.checker.email,
                    phoneNumber: application.checker.phoneNumber,
                    name: application.checker.name,
                    givenName: application.checker.givenName,
                    companyName: application.checker.companyName,
                    location: application.checker.location,
                    establishYear: application.checker.establishYear,
                };
                // Sanitize thông tin
                const sanitizedApplication = await this.sanitizeOutput(application, ctx);


                // Trả về dữ liệu
                return ctx.send({
                    error: false,
                    success: true,
                    message: 'Get application successfully',
                    data: {
                        application: {
                            ...sanitizedApplication,
                            checker: checkerInfo
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
                'api::application.application',
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
                'api::application.application',
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
                text: `The application with ID ${id} has been updated`,
                html: `<p>The application with ID <strong>${id}</strong> has been updated to status: <strong>${process.env.FRONTEND_URL}</strong></p>`,
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


async function checkTransactionId(transactionId) {
    try {
        const response = await axios.get(`https://api-merchant.payos.vn/v2/payment-requests/${transactionId}`, {
            headers: {
                'x-client-id': '522a2a37-e631-4cf1-a968-a4e6b433816d', // Thay thế bằng giá trị thật
                'x-api-key': '93930ef6-563f-427a-bcf8-452f539f62b4'      // Thay thế bằng giá trị thật
            }
        });

        const data = response.data.data;

        // Kiểm tra trạng thái và số tiền còn lại
        if (data.status === 'PAID' && data.amountRemaining === 0) {
            return true; // Transaction ID hợp lệ
        } else {
            return false; // Transaction ID không hợp lệ
        }
    } catch (error) {
        console.error('Error checking transaction ID:', error.message);
        return false; // Nếu có lỗi, coi như transaction ID không hợp lệ
    }
}