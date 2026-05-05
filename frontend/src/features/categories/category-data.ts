export type ProductSummary = {
  slug: string;
  name: string;
  summary: string;
  brand: string;
  priceLabel: string;
  badge: string;
};

export type Category = {
  slug: string;
  name: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  productCount: number;
  filters: string[];
  products: ProductSummary[];
};

export const categories: Category[] = [
  {
    slug: "daily-essentials",
    name: "Chăm sóc hằng ngày",
    description:
      "Nhóm sản phẩm chăm sóc sức khỏe hằng ngày, dễ tìm và dễ mua lại.",
    seoTitle: "Chăm sóc hằng ngày",
    seoDescription:
      "Duyệt nhóm chăm sóc hằng ngày với cấu trúc danh mục tối ưu SEO, bộ lọc, sắp xếp và phân trang.",
    productCount: 24,
    filters: ["Còn hàng", "Vitamin", "Chăm sóc cá nhân", "Dùng cho gia đình"],
    products: [
      {
        slug: "vitamin-c-family-pack",
        name: "Gói Vitamin C Gia Đình",
        summary: "Sản phẩm hỗ trợ sức khỏe gia đình, sẵn sàng đồng bộ dữ liệu catalog từ backend.",
        brand: "Dược phẩm cơ bản Duocmeta",
        priceLabel: "Giá theo nhà thuốc",
        badge: "Hằng ngày",
      },
      {
        slug: "gentle-mineral-sunscreen",
        name: "Kem chống nắng khoáng dịu nhẹ",
        summary: "Thẻ sản phẩm trình bày rõ ràng và không tự quyết giá hoặc tồn kho ở frontend.",
        brand: "Careline",
        priceLabel: "Giá theo nhà thuốc",
        badge: "SPF",
      },
      {
        slug: "hydration-electrolyte-sachets",
        name: "Gói bù nước điện giải",
        summary: "Sản phẩm mẫu cho danh sách storefront responsive.",
        brand: "MetaCare",
        priceLabel: "Giá theo nhà thuốc",
        badge: "Bù nước",
      },
    ],
  },
  {
    slug: "clinical-picks",
    name: "Gợi ý chuyên môn",
    description:
      "Danh mục được biên tập theo tư vấn dược sĩ, hỗ trợ khách hàng tìm hiểu trước khi mua.",
    seoTitle: "Gợi ý chuyên môn",
    seoDescription:
      "Khám phá gợi ý chuyên môn với trang danh mục sẵn sàng SSR và thẻ sản phẩm an toàn thương mại.",
    productCount: 18,
    filters: ["Dược sĩ gợi ý", "Chăm sóc tiêu hóa", "Hỗ trợ giấc ngủ", "Sức khỏe tim mạch"],
    products: [
      {
        slug: "digestive-balance-capsules",
        name: "Viên hỗ trợ cân bằng tiêu hóa",
        summary: "Mô tả sản phẩm được biên tập, sẵn sàng tích hợp API catalog.",
        brand: "Nhà thuốc chuyên môn",
        priceLabel: "Giá theo nhà thuốc",
        badge: "Tiêu hóa",
      },
      {
        slug: "magnesium-night-support",
        name: "Magnesium hỗ trợ ban đêm",
        summary: "Thiết kế để tên sản phẩm và danh mục dễ được công cụ tìm kiếm nhận diện.",
        brand: "RestLab",
        priceLabel: "Giá theo nhà thuốc",
        badge: "Giấc ngủ",
      },
      {
        slug: "omega-3-softgels",
        name: "Viên mềm Omega-3",
        summary: "Thẻ sản phẩm không tự quyết tồn kho hoặc checkout ở frontend.",
        brand: "NutriCore",
        priceLabel: "Giá theo nhà thuốc",
        badge: "Tim mạch",
      },
    ],
  },
  {
    slug: "oncology-prescription",
    name: "Thuốc ung thư kê đơn",
    description:
      "Danh mục thuốc ung thư kê đơn, chỉ hiển thị thông tin sản phẩm và yêu cầu tư vấn bác sĩ hoặc dược sĩ chuyên môn.",
    seoTitle: "Thuốc ung thư kê đơn",
    seoDescription:
      "Duyệt thông tin thuốc ung thư kê đơn với thông điệp an toàn, tư vấn dược sĩ và quy tắc thương mại do backend kiểm soát.",
    productCount: 4,
    filters: ["Thuốc kê đơn", "Ung thư học", "Tư vấn chuyên khoa", "Thông tin tham khảo"],
    products: [
      {
        slug: "keytruda-pembrolizumab",
        name: "Keytruda (pembrolizumab)",
        summary:
          "Thuốc miễn dịch ung thư kê đơn, cần bác sĩ chuyên khoa xác nhận trước khi sử dụng.",
        brand: "Merck Sharp & Dohme",
        priceLabel: "Kê đơn / liên hệ nhà thuốc",
        badge: "Rx",
      },
      {
        slug: "nitrosoureas-oncology-class",
        name: "Nitrosoureas",
        summary:
          "Nhóm thuốc chống ung thư được trình bày dưới dạng thông tin kê đơn và tham khảo.",
        brand: "Tham khảo ung thư học",
        priceLabel: "Kê đơn / liên hệ nhà thuốc",
        badge: "Ung thư học",
      },
      {
        slug: "anthracyclines-oncology-class",
        name: "Anthracyclines",
        summary:
          "Nhóm hóa trị anthracycline với cảnh báo cần theo dõi chuyên khoa.",
        brand: "Tham khảo ung thư học",
        priceLabel: "Kê đơn / liên hệ nhà thuốc",
        badge: "Hóa trị",
      },
      {
        slug: "topoisomerase-inhibitors-oncology-class",
        name: "Topoisomerase inhibitors",
        summary:
          "Nhóm chất ức chế topoisomerase trong ung thư học, không phải hướng dẫn điều trị.",
        brand: "Tham khảo ung thư học",
        priceLabel: "Kê đơn / liên hệ nhà thuốc",
        badge: "DNA",
      },
    ],
  },
  {
    slug: "seasonal-care",
    name: "Chăm sóc theo mùa",
    description:
      "Trang danh mục sẵn sàng cho nhu cầu theo mùa, nội dung landing và danh sách sản phẩm luân phiên.",
    seoTitle: "Chăm sóc theo mùa",
    seoDescription:
      "Xem sản phẩm chăm sóc theo mùa qua trang danh mục responsive, sẵn sàng bộ lọc và phân trang.",
    productCount: 15,
    filters: ["Mùa cảm lạnh", "Du lịch", "Phục hồi da", "Chăm sóc dị ứng"],
    products: [
      {
        slug: "saline-nasal-spray",
        name: "Xịt mũi nước muối",
        summary: "Sản phẩm theo mùa sẵn sàng nhận dữ liệu public products API.",
        brand: "BreatheWell",
        priceLabel: "Giá theo nhà thuốc",
        badge: "Cảm lạnh",
      },
      {
        slug: "travel-first-aid-kit",
        name: "Du lịch First Aid Kit",
        summary: "Thẻ danh mục hỗ trợ duyệt campaign mà không chứa logic checkout.",
        brand: "ReadyCare",
        priceLabel: "Giá theo nhà thuốc",
        badge: "Du lịch",
      },
      {
        slug: "after-sun-repair-gel",
        name: "Gel phục hồi sau nắng",
        summary: "Sản phẩm trong danh sách responsive, sẵn sàng cho ảnh và trường tồn kho.",
        brand: "DaMeta",
        priceLabel: "Giá theo nhà thuốc",
        badge: "Da",
      },
    ],
  },
];

export function getCategoryBySlug(slug: string) {
  return categories.find((category) => category.slug === slug);
}
