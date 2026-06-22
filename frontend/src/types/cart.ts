export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  quantity: number;
  sampleTarget?: "female" | "male";
  /** Termékkép URL; üres string = nincs kép (betöltve DB-ből) */
  imageUrl?: string;
  /** Utolsó ismert készlet (db); a kosár szinkronkor frissül */
  maxStock?: number;
};

export type AddToCartResult = {
  added: number;
  requested: number;
  limitedByStock: boolean;
};
