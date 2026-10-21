"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import AccountLayout from "../../Components/AccountLayout";
import { useAuth } from "../../Contexts/AuthContext";
import { changePassword, saveProfile } from "../../services/api";
import styles from "./Perfil.module.css";

const Perfil = () => {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [message, setMessage] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  useEffect(() => {
    const timeout = window.setTimeout(() => { setName(user?.name ?? ""); setAvatar(user?.avatar ?? ""); }, 0);
    return () => window.clearTimeout(timeout);
  }, [user]);
  if (!user) return <AccountLayout><section className={styles.access}><h1>Entre para ver seu perfil</h1><p>Seu perfil, favoritos e pedidos ficam protegidos pela sua sessão.</p><Link href="/login">Entrar na Kurio</Link></section></AccountLayout>;
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const profile = await saveProfile({ name, avatar });
      setMessage(updateProfile(profile.name, profile.avatar ?? "") ?? "Perfil atualizado com sucesso.");
    } catch { setMessage("Não foi possível atualizar o perfil. Revise os dados ou entre novamente."); }
  };
  const updatePassword = async () => {
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword(""); setNewPassword(""); setMessage("Senha atualizada com sucesso.");
    } catch { setMessage("Não foi possível alterar a senha. Confira a senha atual e tente novamente."); }
  };
  return <AccountLayout><section className={styles.container}><aside className={styles.sidebar}><div className={styles.avatar}>{avatar ? <img src={avatar} alt="" /> : user.name.slice(0, 1).toUpperCase()}</div><h1>{user.name}</h1><p>{user.email}</p><span>Colecionador Kurio</span></aside><form className={styles.form} onSubmit={save}><p className={styles.eyebrow}>MINHA CONTA</p><h2>Perfil do colecionador</h2><label>Nome público<input value={name} onChange={(event) => setName(event.target.value)} /></label><label>URL do avatar <input value={avatar} onChange={(event) => setAvatar(event.target.value)} placeholder="https://..." /></label><section className={styles.password}><h3>Alterar senha</h3><label>Senha atual<input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" /></label><label>Nova senha<input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" /></label><button type="button" onClick={updatePassword} disabled={!currentPassword || newPassword.length < 6}>Alterar senha</button></section>{message && <p className={message.includes("sucesso") ? styles.success : styles.error} role="status">{message}</p>}<button className={styles.save}>Salvar alterações</button></form></section></AccountLayout>;
};
export default Perfil;
