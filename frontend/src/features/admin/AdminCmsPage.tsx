import Link from "next/link";

const cmsSections = [
  {
    href: "/admin/cms/posts",
    title: "Bài viết Blog",
    description: "Viết và đăng bài xuất hiện tại /blog. Bấm Đăng bài để public bài viết.",
  },
  {
    href: "/admin/cms/pages",
    title: "Trang nội dung",
    description: "Tạo trang tĩnh như chính sách/giới thiệu. Mục này không hiển thị trong /blog.",
  },
  { href: "/admin/cms/seo", title: "SEO metadata", description: "Maintain backend-owned index metadata." },
  { href: "/admin/cms/redirects", title: "Redirects", description: "Manage public redirect rules." },
];

export function AdminCmsPage() {
  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-emerald-100 bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">CMS</p>
        <h1 className="mt-3 text-4xl leading-tight text-emerald-950">Quản trị nội dung</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-emerald-900/75">
          Chọn “Bài viết Blog” nếu muốn nội dung xuất hiện ở /blog. Chọn “Trang nội dung” cho các trang tĩnh
          như giới thiệu, chính sách hoặc FAQ.
        </p>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        {cmsSections.map((section) => (
          <Link
            className="rounded-2xl border border-emerald-100 bg-white p-5 hover:border-emerald-400"
            href={section.href}
            key={section.href}
          >
            <h2 className="text-xl text-emerald-950">{section.title}</h2>
            <p className="mt-3 text-sm leading-6 text-emerald-900/75">{section.description}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
