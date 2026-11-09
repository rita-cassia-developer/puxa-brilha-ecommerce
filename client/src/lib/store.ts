export type Category = "Wax" | "TongueDepressor" | "DepilatoryStrips";

export type Product = {
  id: string;
  name: string;
  category: Category;
  price: number;
  imageUrl?: string;
  weightKg?: number;
  oldPrice?: number;
  badge?: string;
  description: string;
  stock: number;
  accent: "olive" | "clay" | "sand" | "rose" | "ink";
  note: string;
};

export type Cart = Record<string, number>;

const PRODUCTS_KEY = "puxa-e-brilha-products-v2";
const CART_KEY = "puxa-e-brilha-cart-v1";

export const categories: Array<"Todos" | Category> = ["Todos", "Wax", "TongueDepressor", "DepilatoryStrips"];

type Seed = Omit<Product, "id" | "category">;

const seeds: Record<Category, Seed[]> = {
  Wax: [
    {
      name: "Puxa & Brilha — Cera de Morango",
      imageUrl: "/brand/pote-padrao-final-quadrado-maior-sem-frase.png",
      description: "Cera de morango que deixa a pele lisa e brilhosa, ideal para clínicas e profissionais de beleza.",
      price: 100,
      weightKg: 1.4,
      stock: 100,
      accent: "rose",
      note: "Cera de morango para uma pele lisa e brilhosa",
      badge: "Produto inicial",
    },
  ],
  TongueDepressor: [
    {
      name: "Abaixador de língua",
      imageUrl: "/brand/abaixador-padrao-final-sem-frase.png",
      description: "Abaixador de língua para apoiar a rotina profissional de beleza.",
      price: 14.9,
      stock: 100,
      accent: "sand",
      note: "Abaixador de língua Puxa & Brilha",
    },
  ],
  DepilatoryStrips: [
    {
      name: "Tiras de depilação",
      imageUrl: "/brand/lenco-padrao-final-sem-frase.png",
      description: "Tiras de depilação para um atendimento prático e organizado.",
      price: 31.9,
      stock: 100,
      accent: "clay",
      note: "Tiras de depilação Puxa & Brilha",
    },
  ],
};

export const initialProducts: Product[] = (Object.entries(seeds) as [Category, Seed[]][]).flatMap(([category, products]) => products.map((product, index) => ({ ...product, category, id: `${category.toLowerCase()}-${String(index + 1).padStart(2, "0")}` })));

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
  window.dispatchEvent(new CustomEvent("puxa-e-brilha-products-updated"));
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
  return value > 0 ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value) : "Preço a confirmar";
}

export function calculateShipping(cep: string) {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) return null;
  const prefix = Number(digits.slice(0, 2));
  if (prefix <= 19) return { price: 12.9, days: "Até 7 dias úteis", label: "Sudeste" };
  if (prefix <= 49) return { price: 18.9, days: "Até 7 dias úteis", label: "Centro-Oeste / Nordeste" };
  if (prefix <= 79) return { price: 24.9, days: "Até 7 dias úteis", label: "Norte / Nordeste" };
  return { price: 29.9, days: "Até 7 dias úteis", label: "Demais regiões" };
}

export function createOrderCode() {
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `YF-${new Date().getFullYear()}-${suffix}`;
}
