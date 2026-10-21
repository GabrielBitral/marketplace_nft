import { Heart, Home, ShoppingCart, UserRound } from "lucide-react";
import styles from "./BottomNav.module.css";
const BottomNav = () => <nav className={styles.navigation} aria-label="Navegação mobile"><button aria-label="Início"><Home fill="currentColor" size={17}/></button><button aria-label="Favoritos"><Heart size={17}/></button><button className={styles.scan} aria-label="Explorar por código">⌑</button><button aria-label="Carrinho"><ShoppingCart size={17}/></button><button aria-label="Minha conta"><UserRound size={17}/></button></nav>;
export default BottomNav;
