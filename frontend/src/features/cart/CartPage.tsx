"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  fetchCart,
  formatMoney,
  getCartSubtotal,
  removeCartItem,
  updateCartItem,
  type Cart,
  type CartItem,
} from "lib/cart";

type MutatingItem = {
  id: string;
  intent: "quantity" | "remove";
};

export function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mutatingItem, setMutatingItem] = useState<MutatingItem | null>(null);

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
          setError(caughtError instanceof Error ? caughtError.message : "Could not load cart.");
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
  const subtotal = useMemo(() => (cart ? getCartSubtotal(cart) : 0), [cart]);

  async function handleQuantityChange(item: CartItem, quantity: number) {
    if (quantity < 1 || quantity === item.quantity) {
      return;
    }

    setError(null);
    setMutatingItem({ id: item.id, intent: "quantity" });

    try {
      setCart(await updateCartItem(item.id, quantity));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not update item.");
    } finally {
      setMutatingItem(null);
    }
  }

  async function handleRemoveItem(item: CartItem) {
    setError(null);
    setMutatingItem({ id: item.id, intent: "remove" });

    try {
      setCart(await removeCartItem(item.id));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not remove item.");
    } finally {
      setMutatingItem(null);
    }
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-10 md:py-14">
      <section className="grid gap-5 border-b border-stone-200 pb-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Cart</p>
          <h1 className="mt-3 text-4xl leading-tight text-stone-950 md:text-5xl">Review your cart</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-600">
            Inventory, final pricing, coupons, shipping, and payment state are revalidated by backend services before
            checkout.
          </p>
        </div>
        <Link
          href="/products"
          className="inline-flex justify-center rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-stone-700 hover:border-stone-950 hover:text-stone-950"
        >
          Continue Shopping
        </Link>
      </section>

      {error ? (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <CartLoading />
      ) : cart && cart.items.length > 0 ? (
        <section className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
          <div className="space-y-4">
            {cart.items.map((item) => (
              <CartLineItem
                key={item.id}
                item={item}
                isUpdating={mutatingItem?.id === item.id}
                mutatingIntent={mutatingItem?.id === item.id ? mutatingItem.intent : null}
                onQuantityChange={handleQuantityChange}
                onRemove={handleRemoveItem}
              />
            ))}
          </div>

          <aside className="rounded-2xl border border-stone-200 bg-white/90 p-6 shadow-[0_20px_50px_rgba(28,25,23,0.05)]">
            <h2 className="text-xl text-stone-950">Order summary</h2>
            <div className="mt-6 space-y-4 border-b border-stone-200 pb-6 text-sm text-stone-600">
              <SummaryRow label="Items" value={`${cart.items.length}`} />
              <SummaryRow label="Subtotal" value={formatMoney(subtotal, currencyCode)} />
              <SummaryRow label="Discount" value="Calculated at checkout" />
              <SummaryRow label="Shipping" value="Calculated at checkout" />
            </div>
            <div className="mt-6 flex items-center justify-between gap-4">
              <span className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
                Estimated subtotal
              </span>
              <span className="text-xl text-stone-950">{formatMoney(subtotal, currencyCode)}</span>
            </div>
            <Link
              href="/checkout"
              className="mt-6 inline-flex w-full justify-center rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white hover:bg-stone-800"
            >
              Checkout
            </Link>
          </aside>
        </section>
      ) : (
        <EmptyCart />
      )}
    </div>
  );
}

function CartLineItem({
  item,
  isUpdating,
  mutatingIntent,
  onQuantityChange,
  onRemove,
}: {
  item: CartItem;
  isUpdating: boolean;
  mutatingIntent: MutatingItem["intent"] | null;
  onQuantityChange: (item: CartItem, quantity: number) => void;
  onRemove: (item: CartItem) => void;
}) {
  const currencyCode = item.product.currency_code;
  const lineTotal = Number(item.variant.price) * item.quantity;

  return (
    <article className="grid gap-5 rounded-2xl border border-stone-200 bg-white/88 p-5 md:grid-cols-[120px_1fr_auto]">
      <div className="flex aspect-square items-end rounded-xl border border-stone-200 bg-stone-100 p-3">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Item</span>
      </div>

      <div className="min-w-0">
        <Link href={`/products/${item.product.slug}`} className="text-xl text-stone-950 hover:text-emerald-800">
          {item.product.name}
        </Link>
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
          SKU {item.variant.sku}
        </p>
        <p className="mt-4 text-sm text-stone-600">
          Unit price {formatMoney(item.variant.price, currencyCode)}
        </p>
      </div>

      <div className="flex flex-col gap-4 md:items-end">
        <label className="text-sm font-medium text-stone-700">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Quantity
          </span>
          <input
            type="number"
            min={1}
            value={item.quantity}
            disabled={isUpdating}
            onChange={(event) => onQuantityChange(item, Number(event.target.value))}
            className="h-11 w-24 rounded-full border border-stone-300 bg-white px-4 text-center text-sm text-stone-950 outline-none focus:border-stone-950"
          />
        </label>
        <p className="text-lg text-stone-950">{formatMoney(lineTotal, currencyCode)}</p>
        <button
          type="button"
          disabled={isUpdating}
          onClick={() => onRemove(item)}
          className="text-sm font-semibold text-red-700 hover:text-red-900 disabled:text-stone-400"
        >
          {isUpdating && mutatingIntent === "remove" ? "Removing..." : "Remove"}
        </button>
      </div>
    </article>
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

function CartLoading() {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white/80 p-8 text-sm text-stone-600">
      Loading cart...
    </div>
  );
}

function EmptyCart() {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white/88 p-8 text-center">
      <h2 className="text-2xl text-stone-950">Your cart is empty</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-stone-600">
        Add products from the catalog, then return here to update quantities or remove items before checkout.
      </p>
      <Link
        href="/products"
        className="mt-6 inline-flex rounded-full bg-stone-950 px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white hover:bg-stone-800"
      >
        Browse Products
      </Link>
    </section>
  );
}
