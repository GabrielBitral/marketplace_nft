"use client";

import Link from "next/link";
import { useNavigate } from "@tanstack/react-router";
import { FormEvent, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../Contexts/AuthContext";
import { Button } from "../ui/button";
import styles from "./AccountForm.module.css";

type AccountFormProps = { mode: "login" | "register"; };
const AccountForm = ({ mode }: AccountFormProps) => {
  const isLogin = mode === "login";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const error = isLogin ? await login(email, password) : await register(name, email, password);
    if (error) { setMessage(error); return; }
    setMessage("Tudo certo! Redirecionando para sua conta...");
    const returnTo = window.sessionStorage.getItem("kurio-return-to") || "/perfil";
    window.sessionStorage.removeItem("kurio-return-to");
    window.setTimeout(() => navigate({ to: returnTo === "/pagamento" ? "/pagamento" : "/perfil" }), 500);
  };
  return <main className={styles.page}><section className={styles.form}><Link href="/" className={styles.logo}>KURIO</Link><h1>{isLogin ? "Bem-vindo de volta" : "Crie sua conta"}</h1><p>{isLogin ? "Entre para continuar sua coleção." : "Sua próxima peça exclusiva está aqui."}</p><form onSubmit={submit}>{!isLogin && <label>Nome completo<input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" /></label>}<label>E-mail<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></label><label>Senha<span><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={isLogin ? "current-password" : "new-password"} /><button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={15}/> : <Eye size={15}/>}</button></span></label>{message && <p role="alert" className={message.startsWith("Tudo") ? styles.success : styles.error}>{message}</p>}<Button className={styles.submit} variant="unstyled" type="submit">{isLogin ? "Entrar" : "Criar conta"}</Button></form><p className={styles.switch}>{isLogin ? "Ainda não tem uma conta?" : "Já coleciona com a Kurio?"} <Link href={isLogin ? "/cadastro" : "/login"}>{isLogin ? "Cadastrar" : "Entrar"}</Link></p></section></main>;
};
export default AccountForm;
