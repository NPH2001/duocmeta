"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";

import { fetchCart, formatMoney, type Cart } from "lib/cart";
import {
  clearCheckoutIdempotencyKey,
  initiatePayment,
  placeOrder,
  previewCheckout,
  type CheckoutPreview,
} from "lib/checkout";

type CheckoutFormState = {
  email: string;
  phone: string;
  fullName: string;
  province: string;
  district: string;
  ward: string;
  addressLine1: string;
  addressLine2: string;
  couponCode: string;
  paymentMethod: "cod" | "online";
  shippingMethod: "express" | "standard";
  notes: string;
};

const initialFormState: CheckoutFormState = {
  email: "",
  phone: "",
  fullName: "",
  province: "",
  district: "",
  ward: "",
  addressLine1: "",
  addressLine2: "",
  couponCode: "",
  paymentMethod: "cod",
  shippingMethod: "standard",
  notes: "",
};

export function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [formState, setFormState] = useState<CheckoutFormState>(initialFormState);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [preview, setPreview] = useState<CheckoutPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    fetchCart()
      .then((result) => {
        if (isMounted) {
          setCart(result);
        }
      })
      .catch((caughtError) => {
        if (isMounted) {
          setError(caughtError instanceof Error ? caughtError.message : "Could not load checkout cart.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const currencyCode = cart?.items[0]?.product.currency_code ?? "VND";

  useEffect(() => {
    let isMounted = true;

    if (!cart || cart.items.length === 0) {
      setPreview(null);
      return;
    }

    setIsPreviewLoading(true);
    setPreviewError(null);

    const timeoutId = window.setTimeout(() => {
      previewCheckout({
        fullName: formState.fullName,
        phone: formState.phone,
        province: formState.province,
        district: formState.district,
        ward: formState.ward,
        addressLine1: formState.addressLine1,
        shippingMethod: formState.shippingMethod,
        paymentMethod: formState.paymentMethod,
        couponCode: formState.couponCode,
      })
        .then((result) => {
          if (isMounted) {
            setPreview(result);
          }
        })
        .catch((caughtError) => {
          if (isMounted) {
            const message = caughtError instanceof Error ? caughtError.message : "Could not load checkout preview.";
            setPreviewError(message);
            setPreview(null);
          }
        })
        .finally(() => {
          if (isMounted) {
            setIsPreviewLoading(false);
          }
        });
    }, 250);

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [
    cart,
    formState.addressLine1,
    formState.couponCode,
    formState.district,
    formState.fullName,
    formState.paymentMethod,
    formState.phone,
    formState.province,
    formState.shippingMethod,
    formState.ward,
  ]);

  function updateField<Key extends keyof CheckoutFormState>(key: Key, value: CheckoutFormState[Key]) {
    setFormState((currentState) => ({ ...currentState, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice("Creating order and requesting payment action from backend...");
    setIsSubmitting(true);

    try {
      const order = await placeOrder({
        email: formState.email,
        phone: formState.phone,
        notes: buildOrderNotes(formState),
      });
      const successUrl = `${window.location.origin}/checkout/success?order_code=${order.order_code}`;
      const payment = await initiatePayment({
        orderCode: order.order_code,
        providerCode: "mock",
        methodCode: formState.paymentMethod === "cod" ? "cod" : "mock_card",
        returnUrl: successUrl,
        cancelUrl: `${window.location.origin}/checkout`,
      });

      clearCheckoutIdempotencyKey();

      if (payment.action_url) {
        window.location.assign(payment.action_url);
        return;
      }

      router.push(`/checkout/success?order_code=${order.order_code}`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Checkout failed.");
      setNotice(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-10 md:py-14">
      <section className="grid gap-5 border-b border-stone-200 pb-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Checkout</p>
          <h1 className="mt-3 text-4xl leading-tight text-stone-950 md:text-5xl">Complete your details</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-600">
            This step collects customer, shipping, and payment preferences. Backend services remain responsible for
            final totals, inventory validation, and payment state.
          </p>
        </div>
        <Link
          href="/cart"
          className={[
            "inline-flex justify-center rounded-full border border-stone-300 px-5 py-3",
            "text-sm font-semibold uppercase tracking-[0.16em] text-stone-700",
            "hover:border-stone-950 hover:text-stone-950",
          ].join(" ")}
        >
          Back to Cart
        </Link>
      </section>

      {error ? (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {notice ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
          {notice}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-2xl border border-stone-200 bg-white/80 p-8 text-sm text-stone-600">
          Loading checkout...
        </div>
      ) : cart && cart.items.length > 0 ? (
        <section className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
          <form onSubmit={handleSubmit} className="space-y-8">
            <CheckoutPanel title="Customer">
              <div className="grid gap-4 md:grid-cols-2">
                <CheckoutField
                  label="Full name"
                  name="fullName"
                  value={formState.fullName}
                  autoComplete="name"
                  onChange={(value) => updateField("fullName", value)}
                />
                <CheckoutField
                  label="Phone"
                  name="phone"
                  type="tel"
                  value={formState.phone}
                  autoComplete="tel"
                  onChange={(value) => updateField("phone", value)}
                />
                <CheckoutField
                  label="Email"
                  name="email"
                  type="email"
                  value={formState.email}
                  autoComplete="email"
                  onChange={(value) => updateField("email", value)}
                  className="md:col-span-2"
                />
              </div>
            </CheckoutPanel>

            <CheckoutPanel title="Shipping address">
              <div className="grid gap-4 md:grid-cols-2">
                <CheckoutField
                  label="Province"
                  name="province"
                  value={formState.province}
                  autoComplete="address-level1"
                  onChange={(value) => updateField("province", value)}
                />
                <CheckoutField
                  label="District"
                  name="district"
                  value={formState.district}
                  autoComplete="address-level2"
                  onChange={(value) => updateField("district", value)}
                />
                <CheckoutField
                  label="Ward"
                  name="ward"
                  value={formState.ward}
                  required={false}
                  autoComplete="address-level3"
                  onChange={(value) => updateField("ward", value)}
                />
                <CheckoutField
                  label="Address line 1"
                  name="addressLine1"
                  value={formState.addressLine1}
                  autoComplete="address-line1"
                  onChange={(value) => updateField("addressLine1", value)}
                />
                <CheckoutField
                  label="Address line 2"
                  name="addressLine2"
                  value={formState.addressLine2}
                  required={false}
                  autoComplete="address-line2"
                  onChange={(value) => updateField("addressLine2", value)}
                  className="md:col-span-2"
                />
              </div>
            </CheckoutPanel>

            <CheckoutPanel title="Payment">
              <fieldset className="mb-5 grid gap-3">
                <legend className="sr-only">Shipping method</legend>
                <PaymentOption
                  label="Standard shipping"
                  description="Backend preview calculates this shipping option."
                  name="shippingMethod"
                  value="standard"
                  checked={formState.shippingMethod === "standard"}
                  onChange={() => updateField("shippingMethod", "standard")}
                />
                <PaymentOption
                  label="Express shipping"
                  description="Backend preview applies the express shipping fee."
                  name="shippingMethod"
                  value="express"
                  checked={formState.shippingMethod === "express"}
                  onChange={() => updateField("shippingMethod", "express")}
                />
              </fieldset>
              <fieldset className="grid gap-3">
                <legend className="sr-only">Payment method</legend>
                <PaymentOption
                  label="Cash on delivery"
                  description="Pay when the order is delivered."
                  name="paymentMethod"
                  value="cod"
                  checked={formState.paymentMethod === "cod"}
                  onChange={() => updateField("paymentMethod", "cod")}
                />
                <PaymentOption
                  label="Online payment"
                  description="Provider action will be connected by the payment tickets."
                  name="paymentMethod"
                  value="online"
                  checked={formState.paymentMethod === "online"}
                  onChange={() => updateField("paymentMethod", "online")}
                />
              </fieldset>
              <CheckoutField
                label="Coupon code"
                name="couponCode"
                value={formState.couponCode}
                required={false}
                onChange={(value) => updateField("couponCode", value)}
                className="mt-5"
              />
              <label className="mt-5 block text-sm font-medium text-stone-700">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Notes
                </span>
                <textarea
                  name="notes"
                  value={formState.notes}
                  onChange={(event) => updateField("notes", event.target.value)}
                  rows={4}
                  className={[
                    "w-full rounded-2xl border border-stone-300 bg-white px-4 py-3",
                    "text-sm text-stone-950 outline-none focus:border-stone-950",
                  ].join(" ")}
                />
              </label>
            </CheckoutPanel>

            <button
              type="submit"
              disabled={isSubmitting}
              className={[
                "w-full rounded-full bg-stone-950 px-6 py-4 text-sm font-semibold uppercase",
                "tracking-[0.16em] text-white hover:bg-stone-800",
              ].join(" ")}
            >
              {isSubmitting ? "Processing..." : "Place Order"}
            </button>
          </form>

          <CheckoutSummary
            cart={cart}
            currencyCode={currencyCode}
            isPreviewLoading={isPreviewLoading}
            preview={preview}
            previewError={previewError}
          />
        </section>
      ) : (
        <section className="rounded-2xl border border-stone-200 bg-white/88 p-8 text-center">
          <h2 className="text-2xl text-stone-950">Your cart is empty</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-stone-600">
            Add products to your cart before starting checkout.
          </p>
          <Link
            href="/products"
            className={[
              "mt-6 inline-flex rounded-full bg-stone-950 px-6 py-3 text-sm font-semibold uppercase",
              "tracking-[0.16em] text-white hover:bg-stone-800",
            ].join(" ")}
          >
            Browse Products
          </Link>
        </section>
      )}
    </div>
  );
}

function CheckoutPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white/88 p-6">
      <h2 className="mb-5 text-xl text-stone-950">{title}</h2>
      {children}
    </section>
  );
}

function CheckoutField({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = true,
  autoComplete,
  className = "",
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  className?: string;
}) {
  return (
    <label className={`block text-sm font-medium text-stone-700 ${className}`}>
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">{label}</span>
      <input
        name={name}
        type={type}
        value={value}
        required={required}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className={[
          "h-12 w-full rounded-full border border-stone-300 bg-white px-4",
          "text-sm text-stone-950 outline-none focus:border-stone-950",
        ].join(" ")}
      />
    </label>
  );
}

function PaymentOption({
  label,
  description,
  name,
  value,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  name: "paymentMethod" | "shippingMethod";
  value: CheckoutFormState["paymentMethod"] | CheckoutFormState["shippingMethod"];
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer gap-4 rounded-2xl border border-stone-200 bg-stone-50/80 p-4">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="mt-1 h-4 w-4 accent-emerald-700"
      />
      <span>
        <span className="block font-medium text-stone-950">{label}</span>
        <span className="mt-1 block text-sm leading-6 text-stone-600">{description}</span>
      </span>
    </label>
  );
}

function CheckoutSummary({
  cart,
  currencyCode,
  isPreviewLoading,
  preview,
  previewError,
}: {
  cart: Cart;
  currencyCode: string;
  isPreviewLoading: boolean;
  preview: CheckoutPreview | null;
  previewError: string | null;
}) {
  return (
    <aside className="rounded-2xl border border-stone-200 bg-white/90 p-6 shadow-[0_20px_50px_rgba(28,25,23,0.05)]">
      <h2 className="text-xl text-stone-950">Checkout preview</h2>
      <div className="mt-6 space-y-5">
        {cart.items.map((item) => (
          <div key={item.id} className="grid grid-cols-[1fr_auto] gap-4 border-b border-stone-100 pb-4">
            <div>
              <p className="font-medium text-stone-950">{item.product.name}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                {item.variant.sku} x {item.quantity}
              </p>
            </div>
            <p className="text-sm text-stone-950">
              {formatMoney(Number(item.variant.price) * item.quantity, item.product.currency_code)}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-6 space-y-4 border-b border-stone-200 pb-6 text-sm text-stone-600">
        {isPreviewLoading ? <p>Refreshing backend preview...</p> : null}
        {previewError ? <p className="text-red-700">{previewError}</p> : null}
        {preview?.validation_warnings.map((warning) => (
          <p className="text-amber-700" key={warning}>{warning}</p>
        ))}
        <SummaryRow
          label="Subtotal"
          value={preview ? formatMoney(preview.subtotal_amount, preview.currency_code) : "Backend preview"}
        />
        <SummaryRow
          label="Discount"
          value={preview ? formatMoney(preview.discount_amount, preview.currency_code) : "Backend preview"}
        />
        <SummaryRow
          label="Shipping"
          value={preview ? formatMoney(preview.shipping_amount, preview.currency_code) : "Backend preview"}
        />
        <SummaryRow
          label="Tax"
          value={preview ? formatMoney(preview.tax_amount, preview.currency_code) : "Backend preview"}
        />
      </div>
      <div className="mt-6 flex items-center justify-between gap-4">
        <span className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
          Preview total
        </span>
        <span className="text-xl text-stone-950">
          {preview ? formatMoney(preview.total_amount, preview.currency_code) : formatMoney(0, currencyCode)}
        </span>
      </div>
    </aside>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span>{label}</span>
      <span className="text-right font-medium text-stone-950">{value}</span>
    </div>
  );
}

function buildOrderNotes(formState: CheckoutFormState): string {
  const addressParts = [
    formState.addressLine1,
    formState.addressLine2,
    formState.ward,
    formState.district,
    formState.province,
  ].filter(Boolean);
  const noteParts = [
    `Ship to: ${formState.fullName}`,
    `Address: ${addressParts.join(", ")}`,
    `Payment preference: ${formState.paymentMethod}`,
    formState.notes ? `Customer notes: ${formState.notes}` : null,
  ].filter(Boolean);

  return noteParts.join("\n");
}
