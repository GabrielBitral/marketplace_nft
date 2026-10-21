"use client";

import Link from "next/link";
import { Menu, Search, ShoppingCart, UserRound } from "lucide-react";
import styles from "./Header.module.css";

type HeaderProps = { cartCount: number; searchValue: string; onSearch: (term: string) => void; onCartClick: () => void; };

const Header = ({ cartCount, searchValue, onSearch, onCartClick }: HeaderProps) => <header className={styles.headerContainer}>
  <Link href="/" className={styles.logo} aria-label="Kurio, página inicial">KURIO</Link>
  <nav className={styles.links} aria-label="Navegação principal"><Link className={styles.active} href="/">Início</Link><a href="#colecoes">Mercado</a><a href="#diario">Diário</a><a href="#agenda">Agenda</a></nav>
  <div className={styles.actions}><label className={styles.search}><Search size={15} /><span className="sr-only">Buscar NFTs</span><input value={searchValue} onChange={(event) => onSearch(event.target.value)} placeholder="Buscar" /></label><button className={styles.iconButton} onClick={onCartClick} aria-label="Ver carrinho"><ShoppingCart size={16} />{cartCount > 0 && <span>{cartCount}</span>}</button><button className={styles.iconButton} aria-label="Abrir perfil"><UserRound size={16} /></button><button className={styles.explore}>Explorar</button></div>
  <div className={styles.mobileBar}><button aria-label="Abrir menu"><Menu size={18} /></button><span>Explorar coleções</span><button aria-label="Filtrar resultados">☷</button></div>
</header>;
export default Header;
