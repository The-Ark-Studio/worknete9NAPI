import type { Schema, Attribute } from '@strapi/strapi';

declare module '@strapi/types' {
  export module Shared { }
}
// import type { Schema, Attribute } from '@strapi/strapi';

// declare module '@strapi/types' {
//   export module Shared {
//     // Bạn có thể thêm các kiểu dữ liệu hoặc interface ở đây nếu cần
//   }

//   // Khai báo thêm các thành phần mà bạn sử dụng trong dự án
//   export interface MyComponent {
//     id: string;
//     attributes: {
//       title: Attribute<string>;
//       // Thêm các thuộc tính khác theo nhu cầu
//     };
//   }
// }
