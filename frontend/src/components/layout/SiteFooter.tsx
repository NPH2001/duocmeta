"use client";

import Link from "next/link";

import { SocialBrandIcon, type SocialBrand } from "components/icons/SocialBrandIcon";
import { useLanguage } from "features/i18n/LanguageProvider";

type FooterLink = {
  href: string;
  label: string;
};

type SocialLink = FooterLink & {
  network: SocialBrand;
};

const supportLinks: FooterLink[] = [
  { href: "/pages/gioi-thieu", label: "Giới thiệu Duocmeta" },
  { href: "/contact", label: "Liên hệ" },
  { href: "/pages/nha-thuoc-chuan-gpp", label: "Nhà thuốc chuẩn GPP" },
  { href: "/faq", label: "Câu hỏi thường gặp" },
  { href: "/pages/gop-y-noi-dung", label: "Góp ý nội dung" },
  { href: "/pages/hop-tac-quang-cao", label: "Hợp tác & quảng cáo" },
];

const policyLinks: FooterLink[] = [
  { href: "/pages/dieu-khoan-su-dung", label: "Điều khoản sử dụng" },
  { href: "/pages/chinh-sach-mua-hang", label: "Chính sách mua hàng" },
  { href: "/pages/chinh-sach-bao-mat", label: "Chính sách bảo mật" },
  { href: "/pages/doi-tra-bao-hanh", label: "Đổi trả & bảo hành" },
  { href: "/pages/giao-hang-thanh-toan", label: "Giao hàng & thanh toán" },
  { href: "/sitemap.xml", label: "Sitemap" },
];

const socialLinks: SocialLink[] = [
  { href: "https://facebook.com/duocmeta", label: "Facebook", network: "facebook" },
  { href: "https://www.linkedin.com/company/duocmeta", label: "LinkedIn", network: "linkedin" },
  { href: "https://www.instagram.com/duocmeta", label: "Instagram", network: "instagram" },
  { href: "https://www.youtube.com/@duocmeta", label: "YouTube", network: "youtube" },
  { href: "https://www.tiktok.com/@duocmeta", label: "TikTok", network: "tiktok" },
];

const trustBadges = ["Chuẩn GPP", "Tư vấn dược sĩ", "Sản phẩm chính hãng"];

export function SiteFooter() {
  const { t } = useLanguage();

  return (
    <footer aria-label={t("footer.aria")} className="border-t border-emerald-100 bg-white text-emerald-950">
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-700 text-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 md:grid-cols-[1.4fr_1fr_1fr] md:items-center md:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-lime-200">Duocmeta Pharmacy</p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight">Nhà thuốc trực tuyến Duocmeta</h2>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
            <span className="rounded-full bg-white/12 px-4 py-2">134k người theo dõi</span>
            <span className="rounded-full bg-white/12 px-4 py-2">14,2k đăng ký</span>
          </div>

          <nav aria-label="Theo dõi Duocmeta" className="flex flex-wrap gap-2 md:justify-end">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                aria-label={link.label}
                title={link.label}
                target="_blank"
                rel="noreferrer"
                className={[
                  "grid h-11 w-11 place-items-center overflow-hidden rounded-2xl bg-white p-1.5 shadow-md shadow-emerald-950/20",
                  "transition duration-200 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-2",
                  "focus-visible:ring-white/80",
                ].join(" ")}
              >
                <SocialBrandIcon brand={link.network} className="h-full w-full rounded-xl object-cover" />
                <span className="sr-only">{link.label}</span>
              </a>
            ))}
          </nav>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-2 md:px-6 lg:grid-cols-[1.15fr_1fr_1fr_1.25fr]">
        <section className="space-y-4">
          <Link href="/" className="inline-flex items-center gap-3" aria-label="Duocmeta">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-600 text-2xl font-bold text-white shadow-lg shadow-emerald-100">
              D+
            </span>
            <span>
              <span className="block text-2xl font-bold uppercase tracking-[0.08em] text-emerald-800">
                Duocmeta
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-600">
                Nhà thuốc trực tuyến
              </span>
            </span>
          </Link>

          <p className="max-w-sm text-sm leading-6 text-emerald-900/75">
            Duocmeta cung cấp sản phẩm chăm sóc sức khỏe và nội dung tham khảo được trình bày rõ ràng,
            dễ tra cứu, ưu tiên an toàn cho người dùng.
          </p>

          <div className="flex flex-wrap gap-2">
            {trustBadges.map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800"
              >
                {badge}
              </span>
            ))}
          </div>
        </section>

        <FooterLinkColumn title="Hỗ trợ khách hàng" links={supportLinks} />
        <FooterLinkColumn title="Chính sách" links={policyLinks} />

        <section className="space-y-5">
          <div>
            <h3 className="text-base font-extrabold text-emerald-950">Mọi thắc mắc liên hệ</h3>
            <ul className="mt-3 space-y-3 text-sm leading-6 text-emerald-900/80">
              <li>
                <span className="font-semibold text-emerald-950">Tổng đài tư vấn:</span>{" "}
                <a href="tel:+84123456789" className="font-bold text-emerald-700 hover:text-emerald-900">
                  0123.456.789
                </a>
              </li>
              <li>
                <span className="font-semibold text-emerald-950">Email hỗ trợ:</span>{" "}
                <a href="mailto:hotro@duocmeta.vn" className="text-emerald-700 hover:text-emerald-900">
                  hotro@duocmeta.vn
                </a>
              </li>
              <li>Văn phòng: 85 Vũ Trọng Phụng, Thanh Xuân, Hà Nội</li>
            </ul>
          </div>
        </section>
      </div>

      <div className="border-t border-emerald-100 bg-emerald-50">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 text-xs leading-5 text-emerald-900/75 md:px-6">
          <p className="font-semibold text-emerald-950">
            Copyright © 2026 Duocmeta. Bản quyền thuộc về Duocmeta.
          </p>
          <p>
            Thông tin trên website chỉ phục vụ mục đích tham khảo và hỗ trợ tra cứu. Người dùng cần tuân thủ hướng dẫn
            của bác sĩ, dược sĩ hoặc nhân viên y tế có chuyên môn trước khi sử dụng thuốc hay sản phẩm chăm sóc sức khỏe.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-md border border-emerald-200 bg-white px-3 py-2 font-bold text-emerald-800">
              DMCA Protected
            </span>
            <span className="rounded-md border border-emerald-200 bg-white px-3 py-2 font-bold text-emerald-800">
              Tín nhiệm mạng
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLinkColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <nav aria-label={title}>
      <h3 className="text-base font-extrabold text-emerald-950">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm text-emerald-900/80">
        {links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className="transition hover:text-emerald-700">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
