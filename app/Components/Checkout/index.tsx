"use client";

import { ChevronLeft, LoaderCircle, WalletCards, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../Contexts/AuthContext";
import { useCart } from "../../Contexts/CartContext";
import { useOrders } from "../../Contexts/OrderContext";
import { useWallets } from "../../Contexts/WalletContext";
import { useNftUpdates } from "../../hooks/useNftUpdates";
import { useDialogFocus } from "../../hooks/useDialogFocus";
import { createOrder as requestOrder, getQuote } from "../../services/api";
import { createRealtimeOrder } from "../../services/realtime";
import type { QuoteDto } from "../../services/contracts";
import styles from "./Checkout.module.css";

type CheckoutProps = { onClose: () => void; onOrderCreated: (orderId: string) => void; };
type Step = "payment" | "processing";

const Checkout = ({ onClose, onOrderCreated }: CheckoutProps) => {
  const { user } = useAuth();
  const { items, applyNftUpdate, quoteRevision, updatedItemIds, acknowledgeQuote, coupon } = useCart();
  const { saveOrder } = useOrders();
  const { wallets } = useWallets();
  const [walletId, setWalletId] = useState("");
  const [network, setNetwork] = useState<"ethereum" | "polygon">("ethereum");
  const [step, setStep] = useState<Step>("payment");
  const [error, setError] = useState("");
  const [approvedQuoteRevision, setApprovedQuoteRevision] = useState(0);
  const [quote, setQuote] = useState<QuoteDto | null>(null);
  const idempotencyKey = useRef(crypto.randomUUID());
  const dialog = useRef<HTMLElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const quoteOutdated = quoteRevision > approvedQuoteRevision;
  const selectedWalletId = walletId || wallets.find((wallet) => wallet.primary)?.id || wallets[0]?.id || "";
  useNftUpdates(applyNftUpdate);
  useDialogFocus(dialog, closeButton, onClose);
  useEffect(() => {
    let active = true;
    if (!items.length) return () => { active = false; };
    void getQuote(items.map((item) => ({ id: item.id, edition: item.edition, quantity: item.quantity })), coupon || undefined).then((nextQuote) => { if (active) setQuote(nextQuote); }).catch(() => { if (active) setError("Não foi possível atualizar a cotação."); });
    return () => { active = false; };
  }, [coupon, items]);
  const confirmOrder = async () => {
    if (!items.length || step === "processing" || !selectedWalletId) return;
    if (quoteOutdated) { setError("A cotação foi atualizada. Revise os valores antes de confirmar."); return; }
    setError("");
    setStep("processing");
    try {
      const refreshedQuote = await getQuote(items.map((item) => ({ id: item.id, edition: item.edition, quantity: item.quantity })), coupon || undefined);
      setQuote(refreshedQuote);
      const order = await requestOrder({ idempotencyKey: idempotencyKey.current, items: items.map((item) => ({ id: item.id, edition: item.edition, quantity: item.quantity })), coupon: coupon || undefined, network, walletId: selectedWalletId });
      saveOrder({ ...order, items: items.map((item) => ({ ...item, price: order.items.find((entry) => entry.id === item.id)?.unitPrice ?? item.price })) });
      if (order.status === "pending") createRealtimeOrder(order.id);
      onOrderCreated(order.id);
    } catch { setError("A cotação mudou ou o pedido não pôde ser criado. Revise os itens e tente novamente."); setStep("payment"); }
  };

  return <div className={styles.backdrop}><section ref={dialog} className={styles.checkout} role="dialog" aria-modal="true" aria-labelledby="checkout-title" tabIndex={-1}><header><button ref={closeButton} onClick={onClose} aria-label="Voltar ao carrinho"><ChevronLeft size={19}/></button><h1 id="checkout-title">Pagamento</h1><button onClick={onClose} aria-label="Fechar pagamento"><X size={17}/></button></header>{step === "processing" ? <div className={styles.processing}><LoaderCircle size={34}/><h2>Confirmando seu pedido</h2><p>Estamos validando a cotação e a disponibilidade dos NFTs.</p></div> : <div className={styles.content}><section className={styles.collector}><p>COLECIONADOR</p><b>{user?.name}</b><span>{user?.email}</span></section><section><h2>Selecione a carteira</h2><div className={styles.wallets}>{wallets.map((wallet) => <button key={wallet.id} className={selectedWalletId === wallet.id ? styles.selected : ""} onClick={() => setWalletId(wallet.id)}><WalletCards size={18}/><span><b>{wallet.name}</b><small>{wallet.address}</small></span><i /></button>)}{!wallets.length && <p>Cadastre uma carteira para continuar.</p>}</div></section><section><h2>Rede</h2><div className={styles.networks}><button className={network === "ethereum" ? styles.selected : ""} onClick={() => setNetwork("ethereum")}>◆ Ethereum</button><button className={network === "polygon" ? styles.selected : ""} onClick={() => setNetwork("polygon")}>⬡ Polygon</button></div></section><section className={styles.review}><h2>Revisão do pedido</h2>{quote?.items.map((item) => <div key={item.id}><span>{item.name} <small>× {item.quantity}</small></span><b>{item.total} ETH</b></div>)}<div><span>Taxa de rede</span><b>{quote?.networkFee ?? "..."} ETH</b></div><div className={styles.total}><span>Total</span><b>{quote?.total ?? "..."} ETH</b></div></section>{quoteOutdated && <div className={styles.quoteAlert} role="status">A cotação foi atualizada para {updatedItemIds.length} item(ns).<button onClick={() => { setApprovedQuoteRevision(quoteRevision); acknowledgeQuote(); }}>Usar valores atualizados</button></div>}{error && <p role="alert" className={styles.disclaimer}>{error}</p>}<button className={styles.confirm} onClick={confirmOrder} disabled={!items.length || quoteOutdated || !quote || !selectedWalletId}>Confirmar e pagar</button><p className={styles.disclaimer}>Ao confirmar, você autoriza a simulação da transação na rede selecionada.</p></div>}</section></div>;
};

export default Checkout;
