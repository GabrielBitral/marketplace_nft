"use client";

import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCart } from "../../Contexts/CartContext";
import { useNftUpdates } from "../../hooks/useNftUpdates";
import { useDialogFocus } from "../../hooks/useDialogFocus";
import { getQuote } from "../../services/api";
import type { QuoteDto } from "../../services/contracts";
import styles from "./Cart.module.css";

type CartProps = { onClose: () => void; onCheckout: () => void; };

const QuoteSkeleton = () => <dl className={styles.summary} aria-label="Atualizando valores do carrinho" aria-busy="true">
  <span className={styles.loadingLabel}>Atualizando valores do carrinho...</span>
  {Array.from({ length: 3 }, (_, index) => <div key={index}><dt className={styles.skeletonLabel} /><dd className={styles.skeletonValue} /></div>)}
</dl>;

const Cart = ({ onClose, onCheckout }: CartProps) => {
  const { items, updateQuantity, removeItem, applyNftUpdate, updatedItemIds, acknowledgeQuote, coupon, setCoupon } = useCart();
  const closeButton = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLElement>(null);
  const [couponInput, setCouponInput] = useState(coupon);
  const [couponStatus, setCouponStatus] = useState<"idle" | "valid" | "invalid">("idle");
  const [quote, setQuote] = useState<QuoteDto | null>(null);
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const applyCoupon = async () => {
    const nextCoupon = couponInput.trim().toUpperCase();
    setIsQuoteLoading(true);
    try {
      const nextQuote = await getQuote(items.map((item) => ({ id: item.id, edition: item.edition, quantity: item.quantity })), nextCoupon || undefined);
      setCoupon(nextCoupon);
      setQuote(nextQuote);
      setCouponStatus(nextCoupon ? "valid" : "idle");
    } catch { setCouponStatus("invalid"); }
    finally { setIsQuoteLoading(false); }
  };
  useEffect(() => {
    let active = true;
    if (!items.length) return () => { active = false; };
    void getQuote(items.map((item) => ({ id: item.id, edition: item.edition, quantity: item.quantity })), coupon || undefined)
      .then((nextQuote) => { if (active) setQuote(nextQuote); })
      .catch(() => { if (active) setQuote(null); })
      .finally(() => { if (active) setIsQuoteLoading(false); });
    return () => { active = false; };
  }, [coupon, items]);
  useDialogFocus(dialog, closeButton, onClose);
  useNftUpdates(applyNftUpdate);

  return <div className={styles.backdrop} role="presentation"><section ref={dialog} className={styles.cart} role="dialog" aria-modal="true" aria-labelledby="cart-title" tabIndex={-1}>
    <header><button ref={closeButton} onClick={onClose} aria-label="Fechar carrinho"><X size={18}/></button><h1 id="cart-title">Carrinho de NFTs</h1></header>
    {items.length === 0 ? <div className={styles.empty}><ShoppingBag size={32}/><p>Seu carrinho está vazio.</p><button onClick={onClose}>Explorar NFTs</button></div> : <><div className={styles.items}>{items.map((item) => <article className={styles.item} key={`${item.id}-${item.edition}`}><div className={styles.thumb} style={{ background: item.color }}><span>{item.accessory}</span></div><div className={styles.itemInfo}><b>{item.name}</b><small>Edição: {item.edition}</small><strong>{item.price} ETH</strong></div><div className={styles.quantity}><button onClick={() => updateQuantity(item.id, item.quantity - 1, item.edition)} aria-label={`Remover uma unidade de ${item.name}`}><Minus size={12}/></button><span>{item.quantity}</span><button onClick={() => updateQuantity(item.id, item.quantity + 1, item.edition)} aria-label={`Adicionar uma unidade de ${item.name}`}><Plus size={12}/></button></div><button className={styles.remove} onClick={() => removeItem(item.id, item.edition)} aria-label={`Remover ${item.name} do carrinho`}><Trash2 size={14}/></button></article>)}</div>
      {updatedItemIds.length > 0 && <div className={styles.updateNotice} role="status">A cotação de {updatedItemIds.length > 1 ? "alguns itens foi atualizada" : "um item foi atualizado"}.<button onClick={acknowledgeQuote}>Entendi</button></div>}<div className={styles.coupon}><input value={couponInput} onChange={(event) => { setCouponInput(event.target.value); setCouponStatus("idle"); }} aria-label="Código promocional" placeholder="Digite o código promocional..." /><button onClick={applyCoupon} disabled={isQuoteLoading}>Aplicar</button>{coupon && <button type="button" onClick={() => { setCoupon(""); setCouponInput(""); setCouponStatus("idle"); }}>Remover cupom</button>}</div>{couponStatus === "valid" && <p className={styles.success} role="status">Cupom KURIO10 aplicado.</p>}{couponStatus === "invalid" && <p className={styles.error} role="alert">Código inválido ou expirado.</p>}
      {!quote ? <QuoteSkeleton /> : <dl className={styles.summary}><div><dt>Subtotal</dt><dd>{quote.subtotal} ETH</dd></div>{quote.discount !== "0.000" && <div><dt>Desconto do lançamento</dt><dd>(-) {quote.discount} ETH</dd></div>}<div><dt>Taxa de rede</dt><dd>{quote.networkFee} ETH</dd></div><div className={styles.total}><dt>Total</dt><dd>{quote.total} ETH</dd></div></dl>}<button className={styles.checkout} onClick={onCheckout} disabled={isQuoteLoading || !quote}>Conectar e finalizar</button></>}
  </section></div>;
};
export default Cart;
