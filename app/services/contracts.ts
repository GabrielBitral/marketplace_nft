export type NftEditionDto = { value: string; available: number; };

export type NftDto = {
  id: string;
  name: string;
  price: string;
  edition: string;
  color: string;
  accessory: string;
  rare?: boolean;
  available: number;
  version: number;
  editions?: NftEditionDto[];
};

export type NftListResponse = { data: NftDto[]; total: number; };
export type NftUpdatedEvent = Pick<NftDto, "id" | "price" | "available" | "version">;
export type OrderUpdatedEvent = { id: string; status: "confirmed" | "refused"; transaction?: string; version: number; user: string; };

export type SessionDto = { user: { name: string; email: string; avatar?: string; }; token: string; };
export type QuoteItemDto = { id: string; edition: string; quantity: number; };
export type QuoteDto = { items: Array<QuoteItemDto & { name: string; unitPrice: string; total: string }>; subtotal: string; discount: string; networkFee: string; total: string; valid: boolean; reason?: string; };
export type CreateOrderDto = { idempotencyKey: string; items: QuoteItemDto[]; coupon?: string; network: "ethereum" | "polygon"; walletId: string; };
export type OrderDto = { id: string; status: "pending" | "confirmed" | "refused"; items: QuoteDto["items"]; subtotal: string; discount: string; networkFee: string; total: string; network: "ethereum" | "polygon"; transaction?: string; version: number; };
export type ProfileDto = { name: string; email: string; avatar?: string; };
export type WalletDto = { id: string; name: string; address: string; network: "Ethereum" | "Polygon"; primary: boolean; };
export type CartDto = NftDto & { quantity: number; };
