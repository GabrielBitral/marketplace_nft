"use client";

import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import { Edit3, Plus, Star } from "lucide-react";
import AccountLayout from "../../Components/AccountLayout";
import { useAuth } from "../../Contexts/AuthContext";
import { type Wallet, useWallets } from "../../Contexts/WalletContext";
import { createWallet, updateWallet } from "../../services/api";
import { useDialogFocus } from "../../hooks/useDialogFocus";
import styles from "./Carteiras.module.css";

const Carteiras = () => {
  const { user } = useAuth();
  const { wallets, saveWallet } = useWallets();
  const [editing, setEditing] = useState<Wallet | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [network, setNetwork] = useState<Wallet["network"]>("Ethereum");
  const [error, setError] = useState("");
  const dialog = useRef<HTMLFormElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  const closeForm = () => { setIsFormOpen(false); setEditing(null); setName(""); setAddress(""); setError(""); };
  const openForm = (wallet?: Wallet) => { setEditing(wallet ?? null); setName(wallet?.name ?? ""); setAddress(wallet?.address ?? ""); setNetwork(wallet?.network ?? "Ethereum"); setError(""); setIsFormOpen(true); };
  useDialogFocus(dialog, nameInput, closeForm, isFormOpen);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !/^0x[a-fA-F0-9.]{4,}$/.test(address.trim())) { setError("Informe nome e endereço público válidos."); return; }
    try {
      const payload = { name, address, network, primary: editing?.primary ?? wallets.length === 0 };
      const wallet = editing ? await updateWallet(editing.id, payload) : await createWallet(payload);
      saveWallet(wallet);
      closeForm();
    } catch { setError("Não foi possível salvar a carteira. Revise os dados e tente novamente."); }
  };
  if (!user) return <AccountLayout><section className={styles.access}><h1>Conecte sua conta para ver as carteiras</h1><Link href="/login">Entrar na Kurio</Link></section></AccountLayout>;
  return <AccountLayout><section className={styles.container}><div className={styles.title}><div><p>MINHA CONTA</p><h1>Carteiras</h1><span>Gerencie as carteiras usadas em suas compras.</span></div><button onClick={() => openForm()}><Plus size={14}/> Adicionar carteira</button></div><div className={styles.list}>{wallets.map((wallet) => <article key={wallet.id}><div className={styles.walletIcon}>◇</div><div><h2>{wallet.name} {wallet.primary && <span><Star size={10} fill="currentColor"/> Principal</span>}</h2><p>{wallet.address}</p><small>{wallet.network}</small></div><button onClick={() => openForm(wallet)} aria-label={`Editar ${wallet.name}`}><Edit3 size={14}/></button></article>)}</div>{isFormOpen && <div className={styles.backdrop}><form ref={dialog} className={styles.dialog} onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="wallet-dialog-title" tabIndex={-1}><h2 id="wallet-dialog-title">{editing ? "Editar carteira" : "Nova carteira"}</h2><label>Nome da carteira<input ref={nameInput} value={name} onChange={(event) => { setName(event.target.value); setError(""); }} placeholder="Ex.: MetaMask" /></label><label>Endereço público<input value={address} onChange={(event) => { setAddress(event.target.value); setError(""); }} placeholder="0x..." /></label><label>Rede<select value={network} onChange={(event) => setNetwork(event.target.value as Wallet["network"])}><option>Ethereum</option><option>Polygon</option></select></label>{error && <p className={styles.error} role="alert">{error}</p>}<div><button type="button" onClick={closeForm}>Cancelar</button><button>Salvar carteira</button></div></form></div>}</section></AccountLayout>;
};
export default Carteiras;
