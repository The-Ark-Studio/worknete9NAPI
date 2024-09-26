
// File: extensions/users-permissions/models/User.js
module.exports = {
    lifecycles: {
        async beforeCreate(data) {
            await assignDefaultAvatar(data);
        },
        async beforeUpdate(params, data) {
            if (!data.avatarImg) {
                await assignDefaultAvatar(data);
            }
        },
    },
};

async function assignDefaultAvatar(data) {
    // Định nghĩa các URL của avatar mặc định
    const avatarUrls = {
        worker: {
            male: 'https://res.cloudinary.com/worknet-e9-images/image/upload/v1727116836/male_user_avatar_da4c7b4fb8.png',
            female: 'https://res.cloudinary.com/worknet-e9-images/image/upload/v1727116832/female_user_avatar_e4ed9455d4.jpg',
        },
        checker: {
            male: 'https://res.cloudinary.com/worknet-e9-images/image/upload/v1727116833/man_avatar_2db9bd1deb.png',
            female: 'https://res.cloudinary.com/worknet-e9-images/image/upload/v1727116832/woman_avatar_bc1d00d540.png',
        },
        admin: {
            male: 'https://res.cloudinary.com/worknet-e9-images/image/upload/v1727116744/admin_man_avatar_5395231be5.png',
            female: 'https://res.cloudinary.com/worknet-e9-images/image/upload/v1727116833/admin_woman_avatar_1f1d834bec.jpg',
        }
    };

    // Kiểm tra role và giới tính của người dùng
    const userRole = data.role?.name || 'guest'; // Lấy role của user
    const gender = data.gender?.toLowerCase() || 'Male'; // Lấy giới tính của user (mặc định male)
    console.log(userRole)
    // Gán avatar dựa trên role và giới tính
    switch (userRole) {
        case 'Worker':
            data.avatarImg = gender === 'Female' ? avatarUrls.worker.female : avatarUrls.worker.male;
            break;
        case 'Checker':
        case 'Supporter':
            data.avatarImg = gender === 'Female' ? avatarUrls.checker.female : avatarUrls.checker.male;
            break;
        case 'Admin':
            data.avatarImg = gender === 'Female' ? avatarUrls.admin.female : avatarUrls.admin.male;
            break;
        default:
            data.avatarImg = avatarUrls.worker.male; // Mặc định nếu không có role phù hợp
            break;
    }
}
