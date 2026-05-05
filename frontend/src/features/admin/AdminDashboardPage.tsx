const dashboardItems = [
  { label: "Sản phẩm", value: "Danh mục sản phẩm", description: "Quản lý hồ sơ sản phẩm và trạng thái xuất bản." },
  { label: "Đơn hàng", value: "Vận hành", description: "Theo dõi đơn hàng và quy trình xử lý." },
  { label: "Tồn kho", value: "Kho hàng", description: "Theo dõi tồn kho phiên bản và điều chỉnh thủ công." },
];

export function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-emerald-100 bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
          Admin
        </p>
        <h1 className="mt-3 text-4xl leading-tight text-emerald-950">Bảng điều khiển quản trị</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-900/75">
          Các trang quản trị được bảo vệ bằng RBAC backend trước khi hiển thị công cụ quản lý.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {dashboardItems.map((item) => (
          <article className="rounded-2xl border border-emerald-100 bg-white p-5" key={item.label}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
              {item.label}
            </p>
            <h2 className="mt-3 text-2xl text-emerald-950">{item.value}</h2>
            <p className="mt-3 text-sm leading-6 text-emerald-900/75">{item.description}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
