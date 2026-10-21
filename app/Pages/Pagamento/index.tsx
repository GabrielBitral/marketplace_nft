"use client";

import { Link, useNavigate } from "@tanstack/react-router";
import Checkout from "../../Components/Checkout";
import { useAuth } from "../../Contexts/AuthContext";

const Pagamento = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  if (!user) return <main className="route-message"><h1>Entre para finalizar sua compra</h1><p>Seu carrinho permanece salvo enquanto você acessa sua conta.</p><Link to="/login">Entrar na Kurio</Link></main>;
  return <Checkout onClose={() => navigate({ to: "/carrinho" })} onOrderCreated={(orderId) => navigate({ to: "/pedido/$orderId", params: { orderId } })} />;
};

export default Pagamento;
