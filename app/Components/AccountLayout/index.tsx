"use client";

import Link from "next/link";
import { LogOut, UserRound, WalletCards } from "lucide-react";
import { useAuth } from "../../Contexts/AuthContext";
import styles from "./AccountLayout.module.css";

const AccountLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth();
  return <main className={styles.page}><header><Link href="/" className={styles.logo}>KURIO</Link><nav><Link href="/perfil"><UserRound size={14}/> Perfil</Link><Link href="/carteiras"><WalletCards size={14}/> Carteiras</Link>{user ? <button onClick={logout}><LogOut size={14}/> Sair</button> : <Link href="/login">Entrar</Link>}</nav></header>{children}</main>;
};
export default AccountLayout;
