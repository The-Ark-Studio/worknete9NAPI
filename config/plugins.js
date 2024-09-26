module.exports = ({ env }) => ({
    email: {
        config: {
            provider: 'strapi-provider-email-brevo',
            providerOptions: {
                apiKey: env('BREVO_API_KEY'), // Use the API key generated earlier
            },
            settings: {
                defaultSenderEmail: env('SENDER_EMAIL'),  // Replace with your Brevo verified email
                defaultSenderName: env('SENDER_NAME'),
                defaultReplyTo: env('SENDER_EMAIL'),
            },
        },
    },
    upload: {
        config: {
            provider: '@strapi/provider-upload-cloudinary',
            providerOptions: {
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                api_key: process.env.CLOUDINARY_API_KEY,
                api_secret: process.env.CLOUDINARY_API_SECRET,
                upload_preset: 'ml_default', // Thêm upload preset nếu cần
            },
            actionOptions: {
                upload: {
                },
                delete: {},
            },
            settings: {
                defaultFrom: env('SENDER_EMAIL'),
                defaultReplyTo: env('SENDER_EMAIL'),
            },
        },
    }
});
