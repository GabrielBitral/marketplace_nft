"use client";

import { useCallback, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import BottomNav from "../../Components/BottomNav";
import Header from "../../Components/Header";
import NftCard, { type Nft } from "../../Components/NftCard";
import { useCart } from "../../Contexts/CartContext";
import { useFavorites } from "../../hooks/useFavorites";
import { useNfts } from "../../hooks/useNfts";
import { useNftUpdates } from "../../hooks/useNftUpdates";
import styles from "./Marketplace.module.css";

const Marketplace = () => {
  const [realtimeNotice, setRealtimeNotice] = useState("");
  const { totalItems, applyNftUpdate } = useCart();
  const { ids: favorites, toggle: toggleFavorite, error: favoriteError } = useFavorites();
  const search = useSearch({ from: "/" });
  const navigate = useNavigate({ from: "/" });
  const term = search.search ?? "";
  const min = search.min ?? "";
  const max = search.max ?? "";
  const sort = search.sort ?? "recent";
  const page = search.page ?? 1;
  const updateFilters = (next: Partial<{ term: string; min: string; max: string; sort: string; page: number }>) => {
    const values = { term, min, max, sort, page, ...next };
    navigate({ to: "/", search: {
      search: values.term || undefined,
      min: values.min || undefined,
      max: values.max || undefined,
      sort: values.sort === "recent" ? undefined : values.sort as "price-asc" | "price-desc",
      page: values.page > 1 ? values.page : undefined,
    } });
  };
  const { data: catalog, isError, isPending, refetch } = useNfts({ term, min, max, sort, page });
  const visibleNfts: Nft[] = catalog?.data ?? [];
  const handleNftUpdate = useCallback((update: { id: string; price: string; available: number; version: number }) => {
    applyNftUpdate(update);
    setRealtimeNotice(`A cotação de #${update.id} foi atualizada para ${update.price} ETH.`);
  }, [applyNftUpdate]);
  useNftUpdates(handleNftUpdate);

  return <><Header cartCount={totalItems} searchValue={term} onSearch={(value) => updateFilters({ term: value, page: 1 })} onCartClick={() => navigate({ to: "/carrinho" })} />{(realtimeNotice || favoriteError) && <div className={styles.realtimeNotice} role="status">{realtimeNotice || "Não foi possível salvar o favorito. A alteração foi desfeita."}<button onClick={() => setRealtimeNotice("")} aria-label="Fechar aviso">×</button></div>}<main>
    <section className={styles.hero}><div className={styles.heroCopy}><p>Bem-vindo à Kurio</p><h1>SEJA DONO DO FUTURO<br />DA ARTE DIGITAL</h1><span>Descubra NFTs selecionados de criadores do mundo todo.</span><button>EXPLORAR</button></div><div className={styles.heroArt}><span>⌁</span></div><i>•••</i></section>
    <section id="colecoes" className={styles.catalog}><aside className={styles.filters}><h2>Coleções</h2>{["KURIO APES (92)", "KURIO NOMADS (38)", "MUTANTS (45)", "PIXEL APES (24)", "JUNGLE BEATS (30)"].map((item) => <button key={item}>{item}</button>)}<h2>Faixa de preço</h2><div className={styles.range}><input aria-label="Preço mínimo" value={min} onChange={(event) => updateFilters({ min: event.target.value })} placeholder="0.00" /><span>—</span><input aria-label="Preço máximo" value={max} onChange={(event) => updateFilters({ max: event.target.value })} placeholder="10.00" /></div><button className={styles.apply} onClick={() => updateFilters({ page: 1 })}>Aplicar</button><h2>NFTs em destaque</h2><div className={styles.featured}><span>⌂</span><p>OFERTA LIMITADA</p></div></aside>
      <div className={styles.results}><div className={styles.resultHeader}><h2>Todos os NFTs</h2><nav><button>Novos lançamentos</button><button>Em alta</button></nav><label className={styles.sort}>Ordenar por <ChevronDown size={13}/><select aria-label="Ordenar NFTs" value={sort} onChange={(event) => updateFilters({ sort: event.target.value, page: 1 })}><option value="recent">Recentes</option><option value="price-asc">Menor preço</option><option value="price-desc">Maior preço</option></select></label><button className={styles.filterButton} aria-label="Filtrar"><SlidersHorizontal size={16}/></button></div>{isPending ? <div className={styles.skeletonGrid} aria-label="Carregando o catálogo" aria-busy="true">{Array.from({ length: 4 }, (_, index) => <div key={index} className={styles.skeletonCard} />)}</div> : isError ? <div className={styles.loading}><p>Não foi possível carregar o catálogo.</p><button onClick={() => void refetch()}>Tentar novamente</button></div> : visibleNfts.length === 0 ? <div className={styles.loading}>Nenhum NFT encontrado com estes filtros.</div> : <><div className={styles.grid}>{visibleNfts.map((nft) => <NftCard key={nft.id} nft={nft} onSelect={(item) => navigate({ to: "/nft/$nftId", params: { nftId: item.id } })} onFavorite={(item) => toggleFavorite(item.id)} favorite={favorites.includes(nft.id)} />)}</div><nav className={styles.pagination} aria-label="Paginação"><button disabled={page === 1} onClick={() => updateFilters({ page: page - 1 })}>Anterior</button><span>Página {page}</span><button disabled={page * 4 >= (catalog?.total ?? 0)} onClick={() => updateFilters({ page: page + 1 })}>Próxima</button></nav></>}</div>
    </section>
  </main><BottomNav /></>;
};

export default Marketplace;
