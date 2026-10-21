"use client";

import { Link, useParams } from "@tanstack/react-router";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCart } from "../../Contexts/CartContext";
import type { Order } from "../../Contexts/OrderContext";
import { useOrders } from "../../Contexts/OrderContext";
import { getOrder } from "../../services/api";
import type { OrderDto } from "../../services/contracts";
import styles from "./Pedido.module.css";

const Pedido = () => {
  const { orderId } = useParams({ from: "/pedido/$orderId" });
  const { orders } = useOrders();
  const { removePurchasedItems } = useCart();
  const clearedOrderId = useRef<string | null>(null);
  const localOrder = orders.find((item) => item.id === orderId);
  const [remoteOrder, setRemoteOrder] = useState<OrderDto | null>(null);
  const [failedOrderId, setFailedOrderId] = useState<string | null>(null);
  const remoteOrderForRoute = remoteOrder?.id === orderId ? remoteOrder : null;
  const order: Order | OrderDto | undefined = localOrder ?? remoteOrderForRoute ?? undefined;
  const loading = !localOrder && !remoteOrderForRoute && failedOrderId !== orderId;
  useEffect(() => {
    if (localOrder) return;
    let active = true;
    void getOrder(orderId).then((nextOrder) => { if (active) setRemoteOrder(nextOrder); }).catch(() => { if (active) setFailedOrderId(orderId); });
    return () => { active = false; };
  }, [localOrder, orderId]);
  useEffect(() => {
    if (order?.status !== "confirmed" || clearedOrderId.current === order.id) return;
    removePurchasedItems(order.items.map((item) => ({ id: item.id, edition: item.edition, quantity: item.quantity })));
    clearedOrderId.current = order.id;
  }, [order, removePurchasedItems]);
  if (loading) return <main className="route-message"><h1>Carregando pedido</h1></main>;
  if (!order) return <main className="route-message"><h1>Pedido não encontrado</h1><Link to="/">Voltar ao marketplace</Link></main>;
  const confirmed = order.status === "confirmed";
  const refused = order.status === "refused";
  return <main className={styles.page}><section className={styles.card}>{confirmed ? <CheckCircle2 /> : refused ? <XCircle /> : <Clock3 />}<p className={styles.brand}>KURIO</p><h1>{confirmed ? "Pedido confirmado!" : refused ? "Pagamento recusado" : "Confirmando seu pedido"}</h1><p>{confirmed ? "Sua arte digital já está reservada para sua carteira." : refused ? "Os itens continuam no seu carrinho. Verifique sua carteira e tente novamente." : "Estamos validando a cotação e a disponibilidade dos NFTs."}</p><dl><div><dt>Pedido</dt><dd>{order.id}</dd></div><div><dt>Rede</dt><dd>{order.network === "ethereum" ? "Ethereum" : "Polygon"}</dd></div>{order.items.map((item) => <div key={item.id}><dt>{item.name} × {item.quantity}</dt><dd>{"price" in item ? item.price : item.unitPrice} ETH</dd></div>)}<div><dt>Subtotal</dt><dd>{order.subtotal} ETH</dd></div>{order.discount && order.discount !== "0.000" && <div><dt>Desconto</dt><dd>(-) {order.discount} ETH</dd></div>}<div><dt>Taxa de rede</dt><dd>{order.networkFee} ETH</dd></div>{order.transaction && <div><dt>Transação</dt><dd>{order.transaction}</dd></div>}<div className={styles.total}><dt>Total</dt><dd>{order.total} ETH</dd></div></dl><Link to={refused ? "/pagamento" : "/perfil"}>{refused ? "Tentar novamente" : "Ver minha coleção"}</Link></section></main>;
};

export default Pedido;
