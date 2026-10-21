"use client";

import { FormEvent, useRef, useState } from "react";
import { Eye, EyeOff, X } from "lucide-react";
import { useAuth } from "../../Contexts/AuthContext";
import { useDialogFocus } from "../../hooks/useDialogFocus";
import styles from "./Auth.module.css";

type AuthProps = { onClose: () => void; onAuthenticated: () => void; };
type FormMode = "login" | "register";

const Auth = ({ onClose, onAuthenticated }: AuthProps) => {
  const [mode, setMode] = useState<FormMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { login, register } = useAuth();
  const dialog = useRef<HTMLElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const isLogin = mode === "login";
  useDialogFocus(dialog, closeButton, onClose);

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = isLogin ? await login(email, password) : await register(name, email, password);
    if (message) { setError(message); return; }
    onAuthenticated();
  };

  return <div className={styles.backdrop}><section ref={dialog} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="auth-title" tabIndex={-1}>
    <button ref={closeButton} className={styles.close} onClick={onClose} aria-label="Fechar"><X size={18}/></button>
    <p className={styles.brand}>KURIO</p><h1 id="auth-title">{isLogin ? "Bem-vindo de volta" : "Crie sua conta"}</h1><p className={styles.subtitle}>{isLogin ? "Entre para continuar sua coleção." : "Sua próxima peça exclusiva está aqui."}</p>
    <form onSubmit={submitForm}>{!isLogin && <label>Nome completo<input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" /></label>}<label>E-mail<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></label><label>Senha<span className={styles.password}><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={isLogin ? "current-password" : "new-password"} /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>{showPassword ? <EyeOff size={15}/> : <Eye size={15}/>}</button></span></label>{error && <p className={styles.error} role="alert">{error}</p>}<button className={styles.submit} type="submit">{isLogin ? "Entrar e continuar" : "Criar conta"}</button></form>
    <p className={styles.switch}>{isLogin ? "Ainda não tem uma conta?" : "Já coleciona com a Kurio?"}<button onClick={() => { setMode(isLogin ? "register" : "login"); setError(""); }}>{isLogin ? "Cadastrar" : "Entrar"}</button></p>{isLogin && <p className={styles.hint}>Use qualquer e-mail válido e uma senha de 6 caracteres.</p>}
  </section></div>;
};
export default Auth;
