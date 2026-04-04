export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  quantity: number;
  /** Termékkép URL; üres string = nincs kép (betöltve DB-ből) */
  imageUrl?: string;
};
