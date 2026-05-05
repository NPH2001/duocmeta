"use client";

import { useEffect, useState } from "react";

import { captureFrontendException, currentSafePath } from "lib/error-tracking";

type AppErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppError({ error, reset }: AppErrorProps) {
  const [eventId, setEventId] = useState<string | null>(null);

  useEffect(() => {
    setEventId(
      captureFrontendException(error, {
        component: "app-error-boundary",
        path: currentSafePath(),
        runtime: "nextjs",
        source: "app/error.tsx",
      })
    );
  }, [error]);

  return (
    <section className="mx-auto max-w-3xl px-6 py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-red-600">Đã xảy ra lỗi</p>
      <h1 className="mt-3 text-3xl font-bold text-emerald-950">Không thể tải trang này.</h1>
      <p className="mt-4 text-emerald-900/75">
        Lỗi đã được ghi nhận để kiểm tra. Thông tin nhạy cảm về thanh toán, tài khoản hoặc đơn hàng không được hiển thị tại đây.
      </p>
      {eventId ? <p className="mt-3 text-sm text-emerald-700">Mã tham chiếu: {eventId}</p> : null}
      <button
        type="button"
        onClick={reset}
        className="mt-8 rounded-full bg-emerald-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
      >
        Thử lại
      </button>
    </section>
  );
}
