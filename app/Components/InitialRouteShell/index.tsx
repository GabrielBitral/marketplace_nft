import Link from "next/link";
import styles from "./InitialRouteShell.module.css";
import type { NftDto } from "../../services/contracts";

type InitialRouteShellProps = { nft?: NftDto; };

const InitialRouteShell = ({ nft }: InitialRouteShellProps) => nft ? <main className={styles.page} aria-label={`Detalhes de ${nft.name}`}>
  <Link className={styles.link} href="/">← Voltar ao marketplace</Link>
  <section className={styles.layout}>
    <div className={styles.nftArt} style={{ background: nft.color }}><span>{nft.accessory}</span>{nft.rare && <b>RARO</b>}</div>
    <div className={styles.nftContent}><p>KURIO APE EDITION</p><h1>{nft.name}</h1><strong>{nft.price} ETH</strong><span>Um colecionável digital limitado, verificado na blockchain Ethereum.</span><div>Edição: {nft.edition}</div><em>Adicionar ao carrinho</em></div>
  </section>
</main> : <main className={styles.page} aria-label="Carregando detalhes do NFT" aria-busy="true">
  <div className={styles.back} />
  <section className={styles.layout}>
    <div className={styles.art} />
    <div className={styles.content}>
      <i /><b /><strong /><span /><span /><em />
    </div>
  </section>
</main>;

export default InitialRouteShell;
