"use client";

import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { useCart } from "../../Contexts/CartContext";
import { useFavorites } from "../../hooks/useFavorites";
import { useNftUpdates } from "../../hooks/useNftUpdates";
import { useNft } from "../../hooks/useNfts";
import styles from "./DetalheNft.module.css";

const DetailSkeleton = () => <main className={styles.page} aria-label="Carregando detalhes do NFT" aria-busy="true">
  <div className={`${styles.skeletonLine} ${styles.skeletonBack}`} />
  <section className={styles.layout}>
    <div className={`${styles.skeleton} ${styles.skeletonArt}`} />
    <div className={styles.skeletonContent}>
      <div className={`${styles.skeleton} ${styles.skeletonEyebrow}`} />
      <div className={`${styles.skeleton} ${styles.skeletonTitle}`} />
      <div className={`${styles.skeleton} ${styles.skeletonPrice}`} />
      <div className={`${styles.skeleton} ${styles.skeletonDescription}`} />
      <div className={`${styles.skeleton} ${styles.skeletonDescription}`} />
      <div className={`${styles.skeleton} ${styles.skeletonOptions}`} />
      <div className={`${styles.skeleton} ${styles.skeletonButton}`} />
    </div>
  </section>
</main>;

const DetalheNft = () => {
  const { nftId } = useParams({ from: "/nft/$nftId" });
  const { data, isPending, isError } = useNft(nftId);
  const [realtimeNft, setRealtimeNft] = useState<typeof data>();
  const [edition, setEdition] = useState("");
  const [quantity, setQuantity] = useState(1);
  const nft = realtimeNft?.id === nftId ? realtimeNft : data;
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { ids, toggle } = useFavorites();
  const handleNftUpdate = useCallback((update: { id: string; price: string; available: number; version: number }) => setRealtimeNft((current) => {
    const source = current?.id === nftId ? current : data;
    return source?.id === update.id && update.version > source.version ? { ...source, ...update } : current;
  }), [data, nftId]);
  useNftUpdates(handleNftUpdate);
  if (isPending) return <DetailSkeleton />;
  if (isError || !nft) return <main className="route-message"><h1>NFT não encontrado</h1><Link to="/">Voltar ao marketplace</Link></main>;

  const editions = nft.editions ?? [{ value: nft.edition, available: nft.available }];
  const selectedEdition = editions.find((item) => item.value === (edition || nft.edition)) ?? editions[0];
  const available = selectedEdition?.available ?? 0;
  const selectedQuantity = Math.min(quantity, Math.max(available, 1));

  const addToCart = () => {
    if (!selectedEdition || available < 1) return;
    addItem({ ...nft, edition: selectedEdition.value, available }, selectedQuantity);
    navigate({ to: "/carrinho" });
  };

  return <main className={styles.page}><Link to="/" className={styles.back}>← Voltar ao marketplace</Link><section className={styles.layout}><div className={styles.art} style={{ background: nft.color }}><span>{nft.accessory}</span>{nft.rare && <b>RARO</b>}</div><div className={styles.content}><p>KURIO APE EDITION</p><h1>{nft.name}</h1><strong>{nft.price} ETH</strong><button className={styles.favorite} onClick={() => toggle(nft.id)} aria-label="Alternar favorito">{ids.includes(nft.id) ? "♥ Favorito" : "♡ Adicionar aos favoritos"}</button><span className={styles.description}>Um colecionável digital limitado, verificado na blockchain Ethereum.</span><div className={styles.editions}><b>Edição:</b>{editions.map((item) => <button key={item.value} onClick={() => { setEdition(item.value); setQuantity(1); }} className={(edition || nft.edition) === item.value ? styles.active : ""} disabled={item.available < 1} aria-label={`${item.value}${item.available < 1 ? ", esgotada" : `, ${item.available} disponíveis`}`}>{item.value}{item.available < 1 && <small>Esgotada</small>}</button>)}</div><div className={styles.quantity}><b>Quantidade:</b><button onClick={() => setQuantity((current) => Math.max(1, current - 1))} disabled={selectedQuantity === 1} aria-label="Diminuir quantidade">−</button><output aria-label="Quantidade selecionada">{selectedQuantity}</output><button onClick={() => setQuantity((current) => Math.min(available, current + 1))} disabled={selectedQuantity >= available || available < 1} aria-label="Aumentar quantidade">+</button><span>{available} disponível(is)</span></div><p className={styles.token}>ID do token: #{nft.id}</p>{available < 1 && <p className={styles.unavailable} role="status">Esta edição está esgotada.</p>}<button className={styles.buy} onClick={addToCart} disabled={available < 1}>Adicionar ao carrinho</button></div></section></main>;
};

export default DetalheNft;
