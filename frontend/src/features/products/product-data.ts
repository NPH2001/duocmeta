export type ProductVariant = {
  id: string;
  label: string;
  sku: string;
  priceLabel: string;
  statusLabel: string;
};

export type ProductDetail = {
  slug: string;
  name: string;
  brand: string;
  categoryName: string;
  categorySlug: string;
  summary: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  badge: string;
  priceLabel: string;
  imageTone: string;
  imagePath?: string;
  imageAlt?: string;
  highlights: string[];
  variants: ProductVariant[];
};

export const products: ProductDetail[] = [
  {
    slug: "vitamin-c-family-pack",
    name: "Gói Vitamin C Gia Đình",
    brand: "Dược phẩm cơ bản Duocmeta",
    categoryName: "Chăm sóc hằng ngày",
    categorySlug: "daily-essentials",
    summary: "Sản phẩm hỗ trợ sức khỏe gia đình, sẵn sàng đồng bộ dữ liệu catalog từ backend.",
    description:
      "Trang chi tiết cho sản phẩm chăm sóc hằng ngày, tối ưu nội dung cho người dùng và công cụ tìm kiếm; giá, tồn kho và giỏ hàng vẫn do backend quyết định.",
    seoTitle: "Gói Vitamin C Gia Đình",
    seoDescription:
      "Xem thông tin Gói Vitamin C Gia Đình trên trang sản phẩm tối ưu SEO, sẵn sàng cho phiên bản, thư viện ảnh và quy tắc thương mại từ backend.",
    badge: "Hằng ngày",
    priceLabel: "Giá theo nhà thuốc",
    imageTone: "from-emerald-100 via-green-50 to-white",
    highlights: ["Dùng cho gia đình", "Dễ mua lại", "Sẵn sàng API catalog"],
    variants: [
      { id: "30-tablets", label: "30 viên", sku: "VC-FAM-30", priceLabel: "Giá theo nhà thuốc", statusLabel: "Chờ API" },
      { id: "60-tablets", label: "60 viên", sku: "VC-FAM-60", priceLabel: "Giá theo nhà thuốc", statusLabel: "Chờ API" },
    ],
  },
  {
    slug: "gentle-mineral-sunscreen",
    name: "Kem chống nắng khoáng dịu nhẹ",
    brand: "Careline",
    categoryName: "Chăm sóc hằng ngày",
    categorySlug: "daily-essentials",
    summary: "Thẻ sản phẩm trình bày rõ ràng và không tự quyết giá hoặc tồn kho ở frontend.",
    description:
      "Trang chi tiết giúp khách hàng xem thông tin rõ ràng, có metadata tốt và sẵn sàng kết nối ảnh, tồn kho, phiên bản từ backend.",
    seoTitle: "Kem chống nắng khoáng dịu nhẹ",
    seoDescription:
      "Xem thông tin Kem chống nắng khoáng dịu nhẹ với bố cục ảnh và lựa chọn phiên bản responsive.",
    badge: "SPF",
    priceLabel: "Giá theo nhà thuốc",
    imageTone: "from-teal-100 via-emerald-50 to-white",
    highlights: ["Hằng ngày protection", "Dịu nhẹ", "Sẵn sàng phiên bản"],
    variants: [
      { id: "50ml", label: "50 ml", sku: "SUN-MIN-50", priceLabel: "Giá theo nhà thuốc", statusLabel: "Chờ API" },
      { id: "100ml", label: "100 ml", sku: "SUN-MIN-100", priceLabel: "Giá theo nhà thuốc", statusLabel: "Chờ API" },
    ],
  },
  {
    slug: "hydration-electrolyte-sachets",
    name: "Gói bù nước điện giải",
    brand: "MetaCare",
    categoryName: "Chăm sóc hằng ngày",
    categorySlug: "daily-essentials",
    summary: "Sản phẩm mẫu cho danh sách storefront responsive.",
    description:
      "Trang sản phẩm bù nước sẵn sàng bán hàng, giữ tổng tiền cuối và kiểm tra tồn kho cho dịch vụ backend.",
    seoTitle: "Gói bù nước điện giải",
    seoDescription:
      "Xem thông tin Gói bù nước điện giải trên trang sản phẩm public tối ưu SEO.",
    badge: "Bù nước",
    priceLabel: "Giá theo nhà thuốc",
    imageTone: "from-emerald-100 via-teal-50 to-white",
    highlights: ["Tiện mang theo", "Dễ xem nhanh", "Tồn kho do backend quyết định"],
    variants: [
      { id: "10-pack", label: "10 gói", sku: "HYD-ELE-10", priceLabel: "Giá theo nhà thuốc", statusLabel: "Chờ API" },
      { id: "20-pack", label: "20 gói", sku: "HYD-ELE-20", priceLabel: "Giá theo nhà thuốc", statusLabel: "Chờ API" },
    ],
  },
  {
    slug: "digestive-balance-capsules",
    name: "Viên hỗ trợ cân bằng tiêu hóa",
    brand: "Nhà thuốc chuyên môn",
    categoryName: "Gợi ý chuyên môn",
    categorySlug: "clinical-picks",
    summary: "Mô tả sản phẩm được biên tập, sẵn sàng tích hợp API catalog.",
    description:
      "Trang sản phẩm chuyên môn với phần ghi chú, phiên bản và thuộc tính sẽ được backend cung cấp.",
    seoTitle: "Viên hỗ trợ cân bằng tiêu hóa",
    seoDescription:
      "Xem Viên hỗ trợ cân bằng tiêu hóa với nội dung chi tiết sẵn sàng tích hợp API catalog.",
    badge: "Tiêu hóa",
    priceLabel: "Giá theo nhà thuốc",
    imageTone: "from-lime-100 via-green-50 to-white",
    highlights: ["Nhóm chuyên môn", "Sẵn sàng thuộc tính", "Route SSR sản phẩm"],
    variants: [
      { id: "30-capsules", label: "30 viên nang", sku: "DIG-BAL-30", priceLabel: "Giá theo nhà thuốc", statusLabel: "Chờ API" },
      { id: "90-capsules", label: "90 viên nang", sku: "DIG-BAL-90", priceLabel: "Giá theo nhà thuốc", statusLabel: "Chờ API" },
    ],
  },
  {
    slug: "magnesium-night-support",
    name: "Magnesium hỗ trợ ban đêm",
    brand: "RestLab",
    categoryName: "Gợi ý chuyên môn",
    categorySlug: "clinical-picks",
    summary: "Thiết kế để tên sản phẩm và danh mục dễ được công cụ tìm kiếm nhận diện.",
    description:
      "Trang sản phẩm hỗ trợ giấc ngủ với khung phiên bản và nội dung SEO sẵn sàng nhận dữ liệu catalog live.",
    seoTitle: "Magnesium hỗ trợ ban đêm",
    seoDescription:
      "Xem thông tin Magnesium hỗ trợ ban đêm với metadata SEO và cấu trúc chọn phiên bản.",
    badge: "Giấc ngủ",
    priceLabel: "Giá theo nhà thuốc",
    imageTone: "from-green-100 via-emerald-50 to-white",
    highlights: ["Thói quen ban đêm", "Chi tiết biên tập", "Sẵn sàng giỏ hàng"],
    variants: [
      { id: "powder", label: "Dạng bột", sku: "MAG-NIGHT-PWD", priceLabel: "Giá theo nhà thuốc", statusLabel: "Chờ API" },
      { id: "capsules", label: "Viên nang", sku: "MAG-NIGHT-CAP", priceLabel: "Giá theo nhà thuốc", statusLabel: "Chờ API" },
    ],
  },
  {
    slug: "omega-3-softgels",
    name: "Viên mềm Omega-3",
    brand: "NutriCore",
    categoryName: "Gợi ý chuyên môn",
    categorySlug: "clinical-picks",
    summary: "Thẻ sản phẩm không tự quyết tồn kho hoặc checkout ở frontend.",
    description:
      "Trang chi tiết cho thực phẩm bổ sung, nơi giá, tồn kho và điều kiện mua vẫn do backend API quyết định.",
    seoTitle: "Viên mềm Omega-3",
    seoDescription:
      "Xem thông tin Viên mềm Omega-3 trên route sản phẩm tối ưu SEO.",
    badge: "Tim mạch",
    priceLabel: "Giá theo nhà thuốc",
    imageTone: "from-lime-100 via-green-50 to-white",
    highlights: ["Thông tin bổ sung", "Giá từ backend", "Bố cục responsive"],
    variants: [
      { id: "60-softgels", label: "60 viên mềm", sku: "OMG-3-60", priceLabel: "Giá theo nhà thuốc", statusLabel: "Chờ API" },
      { id: "120-softgels", label: "120 viên mềm", sku: "OMG-3-120", priceLabel: "Giá theo nhà thuốc", statusLabel: "Chờ API" },
    ],
  },
  {
    slug: "saline-nasal-spray",
    name: "Xịt mũi nước muối",
    brand: "BreatheWell",
    categoryName: "Chăm sóc theo mùa",
    categorySlug: "seasonal-care",
    summary: "Sản phẩm theo mùa sẵn sàng nhận dữ liệu public products API.",
    description:
      "Trang chi tiết sản phẩm theo mùa sẵn sàng cho campaign, SEO và dữ liệu catalog API.",
    seoTitle: "Xịt mũi nước muối",
    seoDescription:
      "Xem thông tin Xịt mũi nước muối với nội dung sẵn sàng cho campaign.",
    badge: "Cảm lạnh",
    priceLabel: "Giá theo nhà thuốc",
    imageTone: "from-teal-100 via-green-50 to-white",
    highlights: ["Chăm sóc mùa vụ", "Sẵn sàng campaign", "Sẽ kết nối API"],
    variants: [
      { id: "single", label: "1 chai", sku: "SAL-SPR-1", priceLabel: "Giá theo nhà thuốc", statusLabel: "Chờ API" },
      { id: "twin", label: "Bộ 2 chai", sku: "SAL-SPR-2", priceLabel: "Giá theo nhà thuốc", statusLabel: "Chờ API" },
    ],
  },
  {
    slug: "travel-first-aid-kit",
    name: "Bộ sơ cứu du lịch",
    brand: "ReadyCare",
    categoryName: "Chăm sóc theo mùa",
    categorySlug: "seasonal-care",
    summary: "Thẻ danh mục hỗ trợ duyệt campaign mà không chứa logic checkout.",
    description:
      "Trang chi tiết cho bộ sản phẩm theo mùa, giữ tình trạng hàng, tổng tiền và quy tắc đặt hàng ở backend.",
    seoTitle: "Bộ sơ cứu du lịch",
    seoDescription:
      "Xem thông tin Bộ sơ cứu du lịch trên trang sản phẩm tối ưu SEO.",
    badge: "Du lịch",
    priceLabel: "Giá theo nhà thuốc",
    imageTone: "from-emerald-100 via-lime-50 to-white",
    highlights: ["Du lịch bundle", "Chi tiết có cấu trúc", "An toàn cho checkout"],
    variants: [
      { id: "compact", label: "Bộ nhỏ gọn", sku: "KIT-TRV-CMP", priceLabel: "Giá theo nhà thuốc", statusLabel: "Chờ API" },
      { id: "family", label: "Bộ gia đình", sku: "KIT-TRV-FAM", priceLabel: "Giá theo nhà thuốc", statusLabel: "Chờ API" },
    ],
  },
  {
    slug: "after-sun-repair-gel",
    name: "Gel phục hồi sau nắng",
    brand: "DaMeta",
    categoryName: "Chăm sóc theo mùa",
    categorySlug: "seasonal-care",
    summary: "Sản phẩm trong danh sách responsive, sẵn sàng cho ảnh và trường tồn kho.",
    description:
      "Trang sản phẩm có khung thư viện ảnh và nội dung sẵn sàng cho ảnh, tồn kho và trường SEO từ API.",
    seoTitle: "Gel phục hồi sau nắng",
    seoDescription:
      "Xem thông tin Gel phục hồi sau nắng với trang chi tiết responsive.",
    badge: "Da",
    priceLabel: "Giá theo nhà thuốc",
    imageTone: "from-lime-100 via-emerald-50 to-white",
    highlights: ["Da recovery", "Sẵn sàng thư viện ảnh", "Route SEO"],
    variants: [
      { id: "75ml", label: "75 ml", sku: "SUN-GEL-75", priceLabel: "Giá theo nhà thuốc", statusLabel: "Chờ API" },
      { id: "150ml", label: "150 ml", sku: "SUN-GEL-150", priceLabel: "Giá theo nhà thuốc", statusLabel: "Chờ API" },
    ],
  },
  {
    slug: "keytruda-pembrolizumab",
    name: "Keytruda (pembrolizumab)",
    brand: "Merck Sharp & Dohme",
    categoryName: "Thuốc ung thư kê đơn",
    categorySlug: "oncology-prescription",
    summary:
      "Thuốc miễn dịch ung thư kê đơn, được trình bày như trang thông tin sản phẩm cần tư vấn bác sĩ chuyên khoa.",
    description:
      "Keytruda là tên thương mại của pembrolizumab, một kháng thể đơn dòng ức chế điểm kiểm soát miễn dịch PD-1. Nội dung này chỉ phục vụ tra cứu sản phẩm dược kê đơn; giá, tồn kho, chỉ định và khả năng đặt mua phải được nhà thuốc hoặc bác sĩ chuyên khoa xác nhận trước khi dùng.",
    seoTitle: "Keytruda pembrolizumab | Thuốc miễn dịch ung thư kê đơn",
    seoDescription:
      "Thông tin sản phẩm Keytruda pembrolizumab với cảnh báo thuốc kê đơn, nguồn tham khảo chính thống và hiển thị thương mại an toàn.",
    badge: "Rx",
    priceLabel: "Kê đơn / liên hệ nhà thuốc",
    imageTone: "from-emerald-100 via-green-50 to-white",
    imagePath: "/products/oncology/keytruda-pembrolizumab.svg",
    imageAlt: "Ảnh minh họa lọ thuốc Keytruda pembrolizumab kê đơn",
    highlights: ["Thuốc kê đơn", "Miễn dịch ung thư", "Cần bác sĩ chỉ định"],
    variants: [
      {
        id: "rx-information",
        label: "Hồ sơ thông tin kê đơn",
        sku: "RX-ONC-KEYTRUDA-INFO",
        priceLabel: "Theo tư vấn",
        statusLabel: "Duyệt kê đơn",
      },
    ],
  },
  {
    slug: "nitrosoureas-oncology-class",
    name: "Nitrosoureas",
    brand: "Tham khảo ung thư học",
    categoryName: "Thuốc ung thư kê đơn",
    categorySlug: "oncology-prescription",
    summary:
      "Nhóm thuốc chống ung thư có thể đi qua hàng rào máu não; chỉ hiển thị dưới dạng thông tin kê đơn.",
    description:
      "Nitrosoureas là nhóm thuốc chống ung thư, ví dụ carmustine và lomustine theo định nghĩa của NCI. Đây là nhóm thuốc điều trị chuyên khoa, không phải sản phẩm tự dùng; mọi chỉ định, phối hợp và theo dõi an toàn phải do bác sĩ quyết định.",
    seoTitle: "Nitrosoureas | Nhóm thuốc ung thư kê đơn",
    seoDescription:
      "Thông tin Nitrosoureas cho trang sản phẩm dược chuyên khoa với cảnh báo kê đơn và hiển thị thương mại an toàn.",
    badge: "Ung thư học",
    priceLabel: "Kê đơn / liên hệ nhà thuốc",
    imageTone: "from-teal-100 via-emerald-50 to-white",
    imagePath: "/products/oncology/nitrosoureas.svg",
    imageAlt: "Ảnh minh họa nhóm thuốc Nitrosoureas",
    highlights: ["Nhóm thuốc ung thư", "Thông tin tham khảo", "Cần chuyên khoa"],
    variants: [
      {
        id: "class-information",
        label: "Hồ sơ nhóm thuốc",
        sku: "RX-ONC-NITROSOUREAS-INFO",
        priceLabel: "Theo tư vấn",
        statusLabel: "Duyệt kê đơn",
      },
    ],
  },
  {
    slug: "anthracyclines-oncology-class",
    name: "Anthracyclines",
    brand: "Tham khảo ung thư học",
    categoryName: "Thuốc ung thư kê đơn",
    categorySlug: "oncology-prescription",
    summary:
      "Nhóm hóa trị anthracycline được trình bày như danh mục tham khảo, ưu tiên cảnh báo an toàn và tư vấn chuyên môn.",
    description:
      "Anthracyclines là nhóm thuốc chống ung thư liên quan tới các thuốc như doxorubicin/amrubicin. Nguồn NCI mô tả các anthracycline có hoạt tính chống ung thư qua tương tác DNA/topoisomerase. Trang này không thay thế toa thuốc hoặc phác đồ điều trị.",
    seoTitle: "Anthracyclines | Nhóm thuốc hóa trị kê đơn",
    seoDescription:
      "Thông tin Anthracyclines trên storefront dược phẩm, có cảnh báo thuốc kê đơn và nội dung tham khảo nguồn chính thống.",
    badge: "Hóa trị",
    priceLabel: "Kê đơn / liên hệ nhà thuốc",
    imageTone: "from-lime-100 via-green-50 to-white",
    imagePath: "/products/oncology/anthracyclines.svg",
    imageAlt: "Ảnh minh họa nhóm thuốc Anthracyclines",
    highlights: ["Hóa trị chuyên khoa", "Theo dõi an toàn", "Không tự ý dùng"],
    variants: [
      {
        id: "class-information",
        label: "Hồ sơ nhóm thuốc",
        sku: "RX-ONC-ANTHRACYCLINES-INFO",
        priceLabel: "Theo tư vấn",
        statusLabel: "Duyệt kê đơn",
      },
    ],
  },
  {
    slug: "topoisomerase-inhibitors-oncology-class",
    name: "Topoisomerase inhibitors",
    brand: "Tham khảo ung thư học",
    categoryName: "Thuốc ung thư kê đơn",
    categorySlug: "oncology-prescription",
    summary:
      "Nhóm chất ức chế topoisomerase trong ung thư học, hiển thị như sản phẩm dược cần xác nhận chuyên môn.",
    description:
      "Topoisomerase inhibitors là các chất chặn topoisomerase, những enzyme cần cho quá trình tế bào phân chia và phát triển. Do đây là nhóm thuốc chuyên khoa ung thư, thông tin trên website chỉ hỗ trợ nhận diện sản phẩm và không phải hướng dẫn điều trị.",
    seoTitle: "Topoisomerase inhibitors | Nhóm thuốc ung thư kê đơn",
    seoDescription:
      "Thông tin nhóm Topoisomerase inhibitors cho website dược phẩm, kèm cảnh báo kê đơn và nội dung tham khảo chính thống.",
    badge: "DNA",
    priceLabel: "Kê đơn / liên hệ nhà thuốc",
    imageTone: "from-emerald-100 via-teal-50 to-white",
    imagePath: "/products/oncology/topoisomerase-inhibitors.svg",
    imageAlt: "Ảnh minh họa nhóm thuốc Topoisomerase inhibitors",
    highlights: ["Tác động DNA", "Ung thư học", "Cần bác sĩ giám sát"],
    variants: [
      {
        id: "class-information",
        label: "Hồ sơ nhóm thuốc",
        sku: "RX-ONC-TOPOISOMERASE-INFO",
        priceLabel: "Theo tư vấn",
        statusLabel: "Duyệt kê đơn",
      },
    ],
  },
];

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}
