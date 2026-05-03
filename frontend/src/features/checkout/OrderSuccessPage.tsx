"use client";

import Link from "next/link";

import { useLanguage } from "features/i18n/LanguageProvider";

type OrderSuccessPageProps = {
  orderCode?: string;
};

export function OrderSuccessPage({ orderCode }: OrderSuccessPageProps) {
  const { t } = useLanguage();

  if (!orderCode) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12 md:py-16">
        <section className="rounded-2xl border border-stone-200 bg-white/88 p-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
            {t("checkout.orderStatus")}
          </p>
          <h1 className="mt-4 text-3xl leading-tight text-stone-950 md:text-5xl">
            {t("checkout.orderReferenceMissing")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-stone-600">
            {t("checkout.orderReferenceMissingDescription")}
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <PrimaryLink href="/products">{t("cart.browseProducts")}</PrimaryLink>
            <SecondaryLink href="/cart">{t("checkout.viewCart")}</SecondaryLink>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12 md:py-16">
      <section className="grid gap-8 rounded-2xl border border-stone-200 bg-white/88 p-8 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
            {t("checkout.orderReceived")}
          </p>
          <h1 className="mt-4 text-4xl leading-tight text-stone-950 md:text-5xl">
            {t("checkout.thankYou")}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-600">
            {t("checkout.orderCreatedDescription")}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-left md:min-w-72">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800">
            {t("checkout.orderCode")}
          </p>
          <p className="mt-3 break-all text-2xl text-stone-950">{orderCode}</p>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <StatusCard title={t("checkout.payment")} value={t("checkout.paymentPending")} />
        <StatusCard title={t("checkout.fulfillment")} value={t("checkout.awaitingProcessing")} />
        <StatusCard title={t("checkout.receipt")} value={t("checkout.emailPending")} />
      </section>

      <section className="grid gap-6 rounded-2xl border border-stone-200 bg-white/88 p-6 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <h2 className="text-2xl text-stone-950">{t("checkout.nextSteps")}</h2>
          <p className="mt-3 text-sm leading-7 text-stone-600">{t("checkout.nextStepsDescription")}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <PrimaryLink href="/products">{t("checkout.continueShopping")}</PrimaryLink>
          <SecondaryLink href="/account/orders">{t("checkout.orderHistory")}</SecondaryLink>
        </div>
      </section>
    </div>
  );
}

function StatusCard({ title, value }: { title: string; value: string }) {
  return (
    <article className="rounded-2xl border border-stone-200 bg-white/88 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">{title}</p>
      <p className="mt-4 text-lg text-stone-950">{value}</p>
    </article>
  );
}

function PrimaryLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="inline-flex justify-center rounded-full bg-stone-950 px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white hover:bg-stone-800"
    >
      {children}
    </Link>
  );
}

function SecondaryLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="inline-flex justify-center rounded-full border border-stone-300 px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-stone-700 hover:border-stone-950 hover:text-stone-950"
    >
      {children}
    </Link>
  );
}
