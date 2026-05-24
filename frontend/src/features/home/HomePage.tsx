"use client";

import Image from "next/image";
import Link from "next/link";

import { useLanguage } from "features/i18n/LanguageProvider";
import { buildPublicMediaUrl, type PublicCategoryListItem, type PublicProductListItem } from "lib/catalog";

const serviceCards = [
  {
    icon: "GPP",
    title: "Nguồn gốc rõ ràng",
    subtitle: "An toàn cho chính người dùng",
    description:
      "Hướng đến sự an toàn của khách hàng. Trao trọn niềm tin cho người sử dụng",
  },
  {
    icon: "DS",
    title: "Tư vấn có định hướng",
    subtitle: "Biết khi nào cần hỏi dược sĩ",
    description:
      "Website không đẩy người dùng mua bằng mọi giá, mà hướng tới quyết định phù hợp hơn khi đang dùng nhiều thuốc hoặc có bệnh nền.",
  },
  {
    icon: "Rx",
    title: "Tôn trọng an toàn điều trị",
    subtitle: "Không thay thế bác sĩ chẩn đoán",
    description:
      "Thuốc kê đơn và các sản phẩm cần chú ý được hiển thị với cảnh báo rõ ràng để người dùng hiểu đâu là thông tin tham khảo, đâu là bước cần xác nhận chuyên môn.",
  },
  {
    icon: "24h",
    title: "Sẵn sàng phục vụ",
    subtitle: "Nhanh chóng, kịp thời và đồng hành cùng bạn",
    description:
      "Hoạt động không nghỉ vì sức khỏe của tất cả khách hàng",}
];

const overviewHighlights = ["Tư vấn dược sĩ khi cần", "Thông tin sản phẩm dễ đọc"];

type HomePageProps = {
  categories: PublicCategoryListItem[];
  latestProducts: PublicProductListItem[];
  featuredProducts: PublicProductListItem[];
};

export function HomePage({ categories, latestProducts, featuredProducts }: HomePageProps) {
  const { t } = useLanguage();

  const categoryMenu = categories.map((category) => ({
    href: `/categories/${category.slug}`,
    label: category.name,
  }));

  const categoryCards = categories.map((category, index) => ({
    ...category,
    href: `/categories/${category.slug}`,
    badge: index === 0 ? "Nổi bật" : `Danh mục ${index + 1}`,
  }));

  const productSections = [
    ...(featuredProducts.length > 0
      ? [
          {
            title: "Sản phẩm nổi bật từ catalog",
            description:
              "Các sản phẩm đang được đánh dấu nổi bật trên backend sẽ xuất hiện tại đây để storefront không còn phụ thuộc dữ liệu mẫu hardcode.",
            tabs: featuredProducts.slice(0, 4).map((product) => (product.is_featured ? "Nổi bật" : "Catalog")),
            products: featuredProducts,
          },
        ]
      : []),
    {
      title: "Sản phẩm mới cập nhật",
      description:
        "Danh sách này lấy trực tiếp từ public catalog API nên các sản phẩm vừa được đăng bán sẽ có thể xuất hiện tại trang chủ.",
      tabs: latestProducts.slice(0, 4).map((product, index) => `Mới ${index + 1}`),
      products: latestProducts,
    },
  ];

  return (
    <div className="bg-[#f4fbf7]">
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:px-6 lg:grid-cols-[260px_minmax(0,1fr)_320px]">
        <aside className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
          <div className="bg-emerald-700 px-5 py-4 text-sm font-bold uppercase tracking-[0.04em] text-white">
            Danh mục sản phẩm
          </div>
          <nav className="divide-y divide-emerald-50" aria-label="Danh mục nổi bật">
            {categoryMenu.length > 0 ? (
              categoryMenu.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between px-5 py-3 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-50"
                >
                  <span>{item.label}</span>
                  <span className="text-xs text-emerald-600">→</span>
                </Link>
              ))
            ) : (
              <div className="px-5 py-4 text-sm text-emerald-800/80">Danh mục công khai sẽ hiển thị tại đây sau khi được kích hoạt trên backend.</div>
            )}
          </nav>
        </aside>

        <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-900 via-emerald-700 to-lime-500 shadow-[0_24px_60px_rgba(4,120,87,0.22)]">
          <div className="grid gap-8 p-8 md:p-10 xl:grid-cols-[1.05fr_0.95fr] xl:items-center">
            <div className="text-white">
              <p className="text-sm font-bold uppercase tracking-[0.08em] text-lime-100">{t("home.kicker")}</p>
              <p className="mt-5 max-w-2xl text-base leading-8 text-emerald-50 md:text-lg">{t("home.description")}</p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/products"
                  className="rounded-full border border-white/60 bg-emerald-600 px-6 py-3 text-sm font-bold uppercase tracking-[0.04em] text-emerald-900 shadow-lg shadow-emerald-950/10"
                >
                  {t("home.browseCatalog")}
                </Link>
                <Link
                  href="/blog"
                  className="rounded-full border border-white/60 bg-emerald-600 px-6 py-3 text-sm font-bold uppercase tracking-[0.04em] text-white transition hover:bg-emerald-500"
                >
                  {t("home.readGuidance")}
                </Link>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-xl">
              <Image
                src="/landing/pharmacy-hero.svg"
                alt="Minh hoạ website nhà thuốc với sản phẩm, tư vấn dược sĩ và điểm nhấn an toàn mua hàng"
                width={960}
                height={720}
                className="h-auto w-full"
                priority
              />
            </div>
          </div>
        </div>

        <aside className="grid gap-4">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-emerald-100">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-emerald-600">Tư vấn nhanh</p>
            <p className="mt-3 text-2xl font-bold text-emerald-950">0123.456.789</p>
            <p className="mt-3 text-sm leading-6 text-emerald-800">
              Dược sĩ hỗ trợ giải đáp về cách dùng, tương tác thuốc, đối tượng sử dụng và các lưu ý trước khi đặt mua.
            </p>
            <div className="mt-5 space-y-2 text-sm text-emerald-900">
              <p>• Mua cho người lớn tuổi hoặc trẻ nhỏ</p>
              <p>• Đang dùng nhiều thuốc cùng lúc</p>
              <p>• Cần xác nhận toa thuốc hoặc nhóm chuyên khoa</p>
            </div>
          </div>
          <div className="rounded-3xl bg-emerald-700 p-6 text-white shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-lime-300">Điều người dùng cần biết</p>
            <ul className="mt-4 space-y-3 text-sm text-emerald-50">
              <li>• Website hỗ trợ tra cứu và định hướng mua phù hợp</li>
              <li>• Không thay thế chẩn đoán hoặc đơn của bác sĩ</li>
            </ul>
          </div>
        </aside>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 pb-10 md:grid-cols-2 md:px-6 lg:grid-cols-4">
        {serviceCards.map((card) => (
          <article
            key={card.title}
            className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-100"
          >
            <div className="grid h-12 w-12 place-items-center rounded-full bg-lime-100 text-sm font-black text-emerald-700">
              {card.icon}
            </div>
            <h2 className="mt-5 text-lg font-bold text-emerald-950">{card.title}</h2>
            <p className="mt-1 text-sm font-semibold text-emerald-600">{card.subtitle}</p>
            <p className="mt-4 text-sm leading-6 text-emerald-800/80">{card.description}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 md:px-6">
        <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-emerald-100 lg:grid lg:grid-cols-[1.05fr_0.95fr]">
          <div className="p-7 md:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-emerald-600">Tổng quan nhà thuốc</p>
            <h2 className="mt-3 text-3xl font-bold text-emerald-950">Chúng tôi muốn mang lại cho khách hàng chất lượng và chi phí thấp nhất</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-800/80">
              Quý khách vui lòng tìm đúng nhóm sản phẩm, đọc thông tin rõ ràng và
              biết ngay khi nào nên liên hệ dược sĩ trước khi mua.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {overviewHighlights.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800"
                >
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-500"
              >
                Nhờ dược sĩ hỗ trợ
              </Link>
              <Link
                href="/products"
                className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-500"
              >
                Xem sản phẩm
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-100 to-white p-4 md:p-6">
            <Image
              src="/landing/pharmacist-support.svg"
              alt="Minh hoạ nhà thuốc trực tuyến với dược sĩ hỗ trợ, thông tin rõ ràng và trải nghiệm mua hàng thân thiện"
              width={760}
              height={640}
              className="h-auto w-full"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 md:px-6">
        <div className="flex flex-col gap-3 border-b border-emerald-100 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-emerald-600">{t("home.categoryHighlights")}</p>
            <h2 className="mt-2 text-3xl font-bold text-emerald-950">{t("home.categoryTitle")}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-emerald-800/75">{t("home.categoryDescription")}</p>
          </div>
          <Link href="/products" className="text-sm font-bold text-emerald-700 hover:text-emerald-900">
            {t("home.viewAllProducts")} →
          </Link>
        </div>
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {categoryCards.length > 0 ? (
            categoryCards.map((category, index) => (
              <article key={category.slug} className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-emerald-100">
                <div
                  className={`min-h-40 bg-gradient-to-br ${
                    index % 3 === 0
                      ? "from-emerald-100 via-lime-50 to-white"
                      : index % 3 === 1
                        ? "from-lime-100 via-emerald-50 to-white"
                        : "from-teal-100 via-emerald-50 to-white"
                  }`}
                  aria-hidden="true"
                />
                <div className="p-7">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.06em] text-emerald-700">
                    {category.badge}
                  </span>
                  <h3 className="mt-4 text-2xl font-bold text-emerald-950">{category.name}</h3>
                  <p className="mt-4 text-sm leading-7 text-emerald-800/80">{category.description ?? "Danh mục này đang được đồng bộ từ database catalog công khai."}</p>
                  <Link href={category.href} className="mt-6 inline-flex rounded-full bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-500">
                    Khám phá danh mục
                  </Link>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-3xl border border-emerald-100 bg-white p-6 text-sm text-emerald-800/80">
              Chưa có danh mục public để hiển thị trên trang chủ.
            </div>
          )}
        </div>
      </section>

      {productSections.map((section) => (
        <ProductShelf key={section.title} {...section} />
      ))}

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="rounded-[2rem] bg-emerald-800 p-7 text-white shadow-sm md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-lime-200">Liên hệ nhanh khi cần</p>
              <h2 className="mt-2 text-3xl font-bold">Cần hỏi thêm về cách dùng hoặc thuốc kê đơn?</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-emerald-50">
                Landing đã được rút gọn để người dùng đỡ mệt hơn, nhưng vẫn giữ các kênh hỗ trợ khi bạn cần xác nhận thêm trước khi mua.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-500"
              >
                Liên hệ dược sĩ
              </Link>
              <Link
                href="/blog"
                className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-500"
              >
                Đọc cẩm nang
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

type ProductShelfProps = {
  title: string;
  description: string;
  tabs: string[];
  products: PublicProductListItem[];
};

function ProductShelf({ title, description, tabs, products: shelfProducts }: ProductShelfProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="mb-6 flex flex-col gap-4 border-b border-emerald-100 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-emerald-600">Danh mục nhà thuốc</p>
          <h2 className="mt-2 text-3xl font-bold text-emerald-950">{title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-emerald-800/75">{description}</p>
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab, index) => (
            <span
              key={`${tab}-${index}`}
              className={`min-w-fit rounded-full px-4 py-2 text-sm font-bold ${
                index === 0 ? "bg-emerald-700 text-white" : "bg-white text-emerald-700 ring-1 ring-emerald-100"
              }`}
            >
              {tab}
            </span>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {shelfProducts.length > 0 ? (
          shelfProducts.map((product) => <ProductCard key={product.slug} product={product} />)
        ) : (
          <div className="rounded-3xl border border-emerald-100 bg-white p-5 text-sm text-emerald-800/80">
            Chưa có sản phẩm public để hiển thị ở khu vực này.
          </div>
        )}
      </div>
    </section>
  );
}

function ProductCard({ product }: { product: PublicProductListItem }) {
  return (
    <article className="group overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-emerald-100 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-100">
      <Link href={`/products/${product.slug}`} className="relative block h-48 overflow-hidden bg-emerald-50">
        {product.primary_image ? (
          <Image
            alt={product.primary_image.alt_text ?? product.name}
            className="object-cover"
            fill
            sizes="(min-width: 1024px) 20vw, (min-width: 640px) 50vw, 100vw"
            src={buildPublicMediaUrl(product.primary_image.storage_key)}
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 via-lime-50 to-white" />
        )}
        <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm font-bold text-emerald-700">
          {!product.primary_image ? (product.is_featured ? "Nổi bật" : "Catalog") : null}
        </div>
        <span className="absolute left-3 top-3 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">
          {product.is_featured ? "Nổi bật" : "Sản phẩm"}
        </span>
        <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-700 px-5 py-2 text-xs font-bold uppercase tracking-[0.04em] text-white opacity-95 shadow-lg">
          Xem chi tiết
        </span>
      </Link>
      <div className="p-5">
        <p className="text-xs font-bold uppercase tracking-[0.06em] text-emerald-600">{product.published_at ? "Đang bán công khai" : "Catalog"}</p>
        <Link
          href={`/products/${product.slug}`}
          className="mt-3 line-clamp-2 block min-h-12 text-base font-bold leading-6 text-emerald-950 hover:text-emerald-700"
        >
          {product.name}
        </Link>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-emerald-800/75">
          {product.short_description ?? "Sản phẩm đang được đồng bộ từ catalog backend."}
        </p>
        <div className="mt-4 flex items-end justify-between gap-3">
          <p className="text-sm font-bold text-red-600">{formatPriceRange(product)}</p>
          <Link href={`/products/${product.slug}`} className="text-xs font-bold uppercase tracking-[0.04em] text-emerald-700">
            Chi tiết
          </Link>
        </div>
      </div>
    </article>
  );
}

function formatPriceRange(product: Pick<PublicProductListItem, "currency_code" | "min_price" | "max_price">) {
  if (product.min_price === null && product.max_price === null) {
    return "Liên hệ nhà thuốc";
  }

  if (product.min_price === product.max_price || product.max_price === null) {
    return formatMoney(product.min_price ?? "0", product.currency_code);
  }

  return `${formatMoney(product.min_price ?? "0", product.currency_code)} - ${formatMoney(product.max_price, product.currency_code)}`;
}

function formatMoney(value: string, currencyCode: string) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return value;
  }

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(amount);
}
