export type Category = "Face" | "Body" | "Hair" | "Fragrance" | "Makeup";

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

// v2 força o catálogo completo no navegador da demonstração, sem misturar o catálogo antigo de 6 itens.
const PRODUCTS_KEY = "lumera-products-v2";
const CART_KEY = "lumera-cart-v1";

export const categories: Array<"Todos" | Category> = ["Todos", "Face", "Body", "Hair", "Fragrance", "Makeup"];

type Seed = Omit<Product, "id" | "category">;

const seeds: Record<Category, Seed[]> = {
  Face: [
    { name: "Sérum Calmante", price: 89.9, oldPrice: 109.9, badge: "Mais amado", description: "Niacinamida, aveia e um toque de calma para a rotina da pele.", stock: 18, accent: "olive", note: "niacinamida + aveia" },
    { name: "Bálsamo de Lábios", price: 39.9, description: "Manteiga de karité e óleo de jojoba em uma camada confortável.", stock: 42, accent: "rose", note: "jojoba + karité" },
    { name: "Bruma Mineral", price: 56.9, badge: "Novo", description: "Um véu fresco de minerais para renovar a pele ao longo do dia.", stock: 11, accent: "sand", note: "água termal + zinco" },
    { name: "Gel de Limpeza Suave", price: 47.9, description: "Limpeza delicada com pH equilibrado para todos os dias.", stock: 25, accent: "clay", note: "aloe vera + chá verde" },
    { name: "Protetor Solar FPS 50", price: 79.9, badge: "Essencial", description: "Proteção diária com toque seco e acabamento confortável.", stock: 31, accent: "sand", note: "filtros solares + vitamina E" },
    { name: "Creme Facial Noturno", price: 94.9, description: "Textura cremosa para uma rotina de autocuidado antes de dormir.", stock: 16, accent: "ink", note: "bakuchiol + squalane" },
    { name: "Esfoliante de Arroz", price: 52.9, description: "Partículas suaves que deixam a pele macia sem repuxar.", stock: 20, accent: "rose", note: "arroz + camomila" },
    { name: "Máscara Facial Calm", price: 44.9, badge: "Ritual", description: "Máscara de argila rosa para um momento de pausa e frescor.", stock: 14, accent: "rose", note: "argila rosa + lavanda" },
    { name: "Contorno dos Olhos", price: 69.9, description: "Cuidado leve para a região dos olhos com efeito refrescante.", stock: 13, accent: "olive", note: "cafeína + pepino" },
    { name: "Água Micelar", price: 42.9, description: "Remove impurezas e maquiagem sem precisar enxaguar.", stock: 28, accent: "sand", note: "água de rosas + pantenol" },
  ],
  Body: [
    { name: "Óleo Essencial Corpo", price: 74.9, badge: "Ritual", description: "Textura seca e aroma de sândalo para desacelerar o dia.", stock: 24, accent: "clay", note: "sândalo + bergamota" },
    { name: "Loção Corporal Algodão", price: 59.9, description: "Hidratação confortável com perfume limpo e delicado.", stock: 30, accent: "sand", note: "algodão + baunilha" },
    { name: "Esfoliante Corporal Café", price: 64.9, description: "Esfoliação nutritiva para uma pele uniforme e macia.", stock: 19, accent: "clay", note: "café + óleo de coco" },
    { name: "Manteiga Corporal Manga", price: 72.9, description: "Manteiga densa para áreas que pedem hidratação intensa.", stock: 17, accent: "rose", note: "manga + murumuru" },
    { name: "Sabonete Líquido Lavanda", price: 36.9, description: "Espuma cremosa e aroma relaxante para o banho.", stock: 38, accent: "ink", note: "lavanda + glicerina" },
    { name: "Creme para as Mãos", price: 34.9, badge: "Presenteável", description: "Cuidado prático para mãos macias durante todo o dia.", stock: 45, accent: "clay", note: "karité + calêndula" },
    { name: "Desodorante Natural", price: 39.9, description: "Proteção suave com fórmula sem alumínio.", stock: 22, accent: "olive", note: "magnésio + capim-limão" },
    { name: "Óleo Corporal Dourado", price: 84.9, description: "Brilho sutil e toque acetinado para ocasiões especiais.", stock: 12, accent: "sand", note: "maracujá + mica dourada" },
    { name: "Nécessaire Ritual Corpo", price: 119.9, badge: "Kit", description: "Trio essencial para levar seu ritual de corpo na bolsa.", stock: 10, accent: "rose", note: "loção + sabonete + creme" },
    { name: "Spray Refrescante Corpo", price: 48.9, description: "Névoa perfumada para refrescar a pele ao longo do dia.", stock: 26, accent: "olive", note: "chá branco + menta" },
  ],
  Hair: [
    { name: "Máscara Terra", price: 68.9, badge: "Últimas unidades", description: "Argila branca e manteiga de murumuru para fios mais macios.", stock: 8, accent: "clay", note: "murumuru + argila" },
    { name: "Shampoo Equilíbrio", price: 54.9, description: "Limpeza gentil para couro cabeludo equilibrado.", stock: 23, accent: "olive", note: "alecrim + hortelã" },
    { name: "Condicionador Nutrição", price: 58.9, description: "Desembaraça e devolve movimento aos fios secos.", stock: 21, accent: "sand", note: "abacate + pantenol" },
    { name: "Leave-in Brilho", price: 62.9, badge: "Best-seller", description: "Finalização leve com brilho e proteção térmica.", stock: 18, accent: "rose", note: "linhaça + proteção UV" },
    { name: "Óleo Capilar Leve", price: 71.9, description: "Selagem das pontas sem pesar no comprimento.", stock: 15, accent: "ink", note: "argan + pracaxi" },
    { name: "Tônico Couro Cabeludo", price: 77.9, description: "Tônico refrescante para uma rotina de cuidado completa.", stock: 13, accent: "olive", note: "cafeína + niacinamida" },
    { name: "Spray Texturizador", price: 49.9, description: "Textura natural e volume flexível para o penteado.", stock: 20, accent: "clay", note: "sal marinho + aloe" },
    { name: "Creme para Cachos", price: 66.9, description: "Define cachos com maciez e controle do frizz.", stock: 17, accent: "rose", note: "linhaça + manteiga de karité" },
    { name: "Kit Hidratação Capilar", price: 139.9, badge: "Kit", description: "Dupla de shampoo e máscara para fios ressecados.", stock: 9, accent: "sand", note: "coco + ácido hialurônico" },
    { name: "Pente de Madeira", price: 29.9, description: "Acessório de madeira para desembaraçar com delicadeza.", stock: 33, accent: "clay", note: "madeira natural" },
  ],
  Fragrance: [
    { name: "Eau de Peau 01", price: 129.9, badge: "Assinatura", description: "A pele depois do banho: musk limpo, íris e madeira clara.", stock: 15, accent: "ink", note: "íris + musk limpo" },
    { name: "Eau de Peau 02", price: 129.9, description: "Floral transparente com saída fresca e fundo cremoso.", stock: 14, accent: "rose", note: "peônia + sândalo" },
    { name: "Body Splash Aurora", price: 79.9, description: "Perfume leve para reaplicar e levar na bolsa.", stock: 27, accent: "sand", note: "pêra + musk" },
    { name: "Colônia Chá Branco", price: 89.9, description: "Aroma limpo e confortável para todos os momentos.", stock: 19, accent: "olive", note: "chá branco + cedro" },
    { name: "Perfume Sândalo", price: 149.9, badge: "Intenso", description: "Madeira quente com especiarias e presença elegante.", stock: 11, accent: "clay", note: "sândalo + pimenta rosa" },
    { name: "Perfume Flor de Laranjeira", price: 139.9, description: "Floral solar, luminoso e fácil de usar.", stock: 13, accent: "sand", note: "neroli + flor de laranjeira" },
    { name: "Óleo Perfumado Íris", price: 69.9, description: "Perfume concentrado em óleo para aplicar nos pulsos.", stock: 16, accent: "ink", note: "íris + baunilha" },
    { name: "Vela Aromática Calm", price: 59.9, description: "Aroma de lavanda e cedro para perfumar a casa.", stock: 22, accent: "olive", note: "lavanda + cedro" },
    { name: "Difusor Casa Lumera", price: 84.9, description: "Fragrância contínua para deixar o ambiente acolhedor.", stock: 18, accent: "rose", note: "figo + folhas verdes" },
    { name: "Mini Perfume Descoberta", price: 49.9, badge: "Para testar", description: "Cinco miniaturas para encontrar sua assinatura.", stock: 25, accent: "clay", note: "seleção de fragrâncias" },
  ],
  Makeup: [
    { name: "Batom Cremoso Rosa Lumera", price: 49.9, badge: "Mais vendido", description: "Batom confortável com acabamento cremoso e cor construível.", stock: 34, accent: "rose", note: "manteiga de karité" },
    { name: "Batom Matte Terra", price: 52.9, description: "Cor intensa e acabamento matte sem ressecar os lábios.", stock: 29, accent: "clay", note: "vitamina E + jojoba" },
    { name: "Gloss Brilho Natural", price: 39.9, description: "Brilho espelhado com textura confortável e não pegajosa.", stock: 41, accent: "sand", note: "ácido hialurônico" },
    { name: "Blush Cremoso Coral", price: 54.9, description: "Blush fácil de espalhar para um efeito corado natural.", stock: 24, accent: "rose", note: "pigmentos minerais" },
    { name: "Paleta Olhos Essencial", price: 89.9, badge: "Kit", description: "Oito tons versáteis para looks do dia e da noite.", stock: 18, accent: "ink", note: "acabamentos matte + brilho" },
    { name: "Máscara de Cílios Alongadora", price: 59.9, description: "Alongamento definido e volume na medida certa.", stock: 26, accent: "ink", note: "pantenol + cera vegetal" },
    { name: "Delineador Marrom", price: 34.9, description: "Traço preciso e confortável para um olhar definido.", stock: 32, accent: "clay", note: "fórmula de longa duração" },
    { name: "Base Líquida Natural", price: 79.9, description: "Cobertura leve a média com acabamento natural e luminoso.", stock: 21, accent: "sand", note: "niacinamida + vitamina E" },
    { name: "Corretivo Luminoso", price: 64.9, description: "Disfarça olheiras e ilumina sem marcar as linhas.", stock: 23, accent: "olive", note: "cafeína + ácido hialurônico" },
    { name: "Pó Translúcido", price: 57.9, description: "Controla o brilho e fixa a maquiagem com leveza.", stock: 20, accent: "sand", note: "sílica mineral" },
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
