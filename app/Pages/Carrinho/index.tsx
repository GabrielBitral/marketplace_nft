"use client";

import { useNavigate } from "@tanstack/react-router";
import Cart from "../../Components/Cart";
import { useAuth } from "../../Contexts/AuthContext";

const Carrinho = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  return <Cart onClose={() => navigate({ to: "/" })} onCheckout={() => {
    if (!user) window.sessionStorage.setItem("kurio-return-to", "/pagamento");
    navigate({ to: user ? "/pagamento" : "/login" });
  }} />;
};

export default Carrinho;
