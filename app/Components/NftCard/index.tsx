import styles from "./NftCard.module.css";

export type Nft = { id: string; name: string; price: string; edition: string; color: string; accessory: string; rare?: boolean; available?: number; version?: number; };
type NftCardProps = { nft: Nft; onSelect: (nft: Nft) => void; onFavorite?: (nft: Nft) => void; favorite?: boolean; };

const NftCard = ({ nft, onSelect, onFavorite, favorite }: NftCardProps) => <article className={styles.card}><button className={styles.image} style={{ background: nft.color }} onClick={() => onSelect(nft)} aria-label={`Ver ${nft.name}${nft.rare ? " raro" : ""}`}><span className={styles.ape} aria-hidden="true">{nft.accessory}</span>{nft.rare && <b aria-hidden="true">RARO</b>}</button><div className={styles.info}><button onClick={() => onSelect(nft)} className={styles.name}>{nft.name}</button>{onFavorite && <button className={styles.heart} onClick={() => onFavorite(nft)} aria-label="Adicionar aos favoritos">{favorite ? "♥" : "♡"}</button>}<p>{nft.price} ETH</p></div></article>;
export default NftCard;
