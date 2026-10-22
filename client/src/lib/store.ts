export type Category = "Face" | "Body" | "Hair" | "Fragrance";

export type Product = {
  id: string;
  name: string;
  category: Category;
  price: number;
  oldPrice?: number;
  badge?: string;
  description: string;
  stock: number;
  accent: "olive" | "clay" | "sand" | "rose" | "ink";
  note: string;
};

export type Cart = Record<string, number>;

const PRODUCTS_KEY = "lumera-products-v1";
const CART_KEY = "lumera-cart-v1";

export const categories: Array<"Todos" | Category> = ["Todos", "Face", "Body", "Hair", "Fragrance"];

export const initialProducts: Product[] = [
  {
    id: "serum-01",
    name: "Sérum Calmante",
    category: "Face",
    price: 89.9,
    oldPrice: 109.9,
    badge: "Mais amado",
    description: "Niacinamida, aveia e um toque de calma para a rotina da pele.",
    stock: 18,
    accent: "olive",
    note: "niacinamida + aveia",
  },
  {
    id: "oil-02",
    name: "Óleo Essencial Corpo",
    category: "Body",
    price: 74.9,
    badge: "Ritual",
    description: "Textura seca e aroma de sândalo para desacelerar o dia.",
    stock: 24,
    accent: "clay",
    note: "sândalo + bergamota",
  },
  {
    id: "balm-03",
    name: "Bálsamo de Lábios",
    category: "Face",
    price: 39.9,
    description: "Manteiga de karité e óleo de jojoba em uma camada confortável.",
    stock: 42,
    accent: "rose",
    note: "jojoba + karité",
  },
  {
    id: "mist-04",
    name: "Bruma Mineral",
    category: "Face",
    price: 56.9,
    badge: "Novo",
    description: "Um véu fresco de minerais para renovar a pele ao longo do dia.",
    stock: 11,
    accent: "sand",
    note: "água termal + zinco",
  },
  {
    id: "mask-05",
    name: "Máscara Terra",
    category: "Hair",
    price: 68.9,
    description: "Argila branca e manteiga de murumuru para fios mais macios.",
    stock: 8,
    badge: "Últimas unidades",
    accent: "clay",
    note: "murumuru + argila",
  },
  {
    id: "scent-06",
    name: "Eau de Peau 01",
    category: "Fragrance",
    price: 129.9,
    description: "A pele depois do banho: musk limpo, íris e madeira clara.",
    stock: 15,
    badge: "Assinatura",
    accent: "ink",
    note: "íris + musk limpo",
  },
];

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function loadProducts(): Product[] {
  const saved = readStorage<Product[]>(PRODUCTS_KEY, initialProducts);
  return Array.isArray(saved) && saved.length > 0 ? saved : initialProducts;
}

export function saveProducts(products: Product[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  window.dispatchEvent(new CustomEvent("lumera-products-updated"));
}

export function loadCart(): Cart {
  const saved = readStorage<Cart>(CART_KEY, {});
  return saved && typeof saved === "object" ? saved : {};
}

export function saveCart(cart: Cart) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function calculateShipping(cep: string) {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) return null;
  const prefix = Number(digits.slice(0, 2));
  if (prefix <= 19) return { price: 12.9, days: "3 a 5 dias úteis", label: "Sudeste" };
  if (prefix <= 49) return { price: 18.9, days: "5 a 7 dias úteis", label: "Centro-Oeste / Nordeste" };
  if (prefix <= 79) return { price: 24.9, days: "6 a 9 dias úteis", label: "Norte / Nordeste" };
  return { price: 29.9, days: "7 a 10 dias úteis", label: "Demais regiões" };
}

export function createOrderCode() {
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `LM-${new Date().getFullYear()}-${suffix}`;
}
