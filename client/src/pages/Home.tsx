import { ProductVisual } from "@/components/ProductVisual";
import { Button } from "@/components/ui/button";
import { categories, calculateShipping, createOrderCode, formatCurrency, loadCart, loadProducts, saveCart, type Cart, type Product } from "@/lib/store";
import { ArrowRight, Check, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, CreditCard, LockKeyhole, Menu, Minus, PackageCheck, Plus, Search, ShieldCheck, ShoppingBag, Sparkles, Truck, X, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

const navItems = ["Rosto", "Corpo", "Cabelos", "Fragrâncias"];
const categoryMap: Record<string, Product["category"]> = { Rosto: "Face", Corpo: "Body", Cabelos: "Hair", Fragrâncias: "Fragrance" };

function Header({ count, onCart }: { count: number; onCart: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="announcement"><span>frete grátis nas compras acima de R$ 180</span><span className="announcement-detail">envio calculado pelo CEP no checkout</span></div>
      <div className="header-main container">
        <button className="mobile-menu" onClick={() => setMenuOpen(v => !v)} aria-label="Abrir menu"><Menu size={20} /></button>
        <Link href="/" className="wordmark"><span className="wordmark-mark">⌒</span>lumera</Link>
        <nav className={`main-nav ${menuOpen ? "main-nav-open" : ""}`}>
          <a href="#novidades" onClick={() => setMenuOpen(false)}>Novidades</a>
          {navItems.map(item => <a key={item} href={`#${categoryMap[item].toLowerCase()}`} onClick={() => setMenuOpen(false)}>{item}</a>)}
          <a href="#manifesto" onClick={() => setMenuOpen(false)}>Manifesto</a>
        </nav>
        <div className="header-actions">
          <button className="icon-button search-button" aria-label="Buscar"><Search size={19} /></button>
          <Link href="/admin" className="admin-link">Área admin</Link>
          <button className="bag-button" onClick={onCart} aria-label={`Abrir carrinho com ${count} itens`}><ShoppingBag size={19} /><span>{count}</span></button>
        </div>
      </div>
    </header>
  );
}

function Hero({ onExplore }: { onExplore: () => void }) {
  return <section className="hero container">
    <div className="hero-copy">
      <div className="eyebrow"><span className="eyebrow-line" /> beleza essencial, sem excessos</div>
      <h1>O essencial,<br /><em>em sua melhor forma.</em></h1>
      <p>Fórmulas honestas e sensoriais para transformar o cuidado diário em um pequeno ritual de presença.</p>
      <button className="button button-dark" onClick={onExplore}>explorar coleção <ArrowRight size={17} /></button>
      <div className="hero-footnote"><ShieldCheck size={16} /> fórmulas veganas · não testadas em animais</div>
    </div>
    <div className="hero-art" aria-label="Composição visual de cosméticos Lumera">
      <div className="hero-art-label"><span>01</span><span>rituais<br />que ficam</span></div>
      <div className="hero-disc hero-disc-back" /><div className="hero-disc hero-disc-front" />
      <div className="hero-bottle hero-bottle-tall"><div className="bottle-cap" /><div className="bottle-label"><b>L</b><small>CALM</small></div></div>
      <div className="hero-bottle hero-bottle-short"><div className="bottle-lid" /><div className="bottle-label"><b>lumera</b><small>body ritual</small></div></div>
      <div className="hero-sprig"><span /><span /><span /><span /></div>
      <div className="hero-caption">série essencial<br /><b>calma mineral</b></div>
    </div>
  </section>;
}

function ProductCard({ product, onAdd }: { product: Product; onAdd: (product: Product) => void }) {
  return <article className="product-card">
    <div className="product-card-media"><ProductVisual product={product} />{product.badge && <span className="product-badge">{product.badge}</span>}<button className="quick-add" onClick={() => onAdd(product)} aria-label={`Adicionar ${product.name}`}><Plus size={18} /></button></div>
    <div className="product-card-info"><div className="product-meta"><span>{product.category}</span><span>●</span><span>vegano</span></div><h3>{product.name}</h3><p>{product.description}</p><div className="product-card-bottom"><strong>{formatCurrency(product.price)}</strong><button onClick={() => onAdd(product)}>adicionar <ArrowRight size={14} /></button></div></div>
  </article>;
}

function CartDrawer({ cart, products, onClose, onChange, onCheckout }: { cart: Cart; products: Product[]; onClose: () => void; onChange: (id: string, delta: number) => void; onCheckout: () => void }) {
  const items = products.filter(product => cart[product.id]);
  const subtotal = items.reduce((sum, product) => sum + product.price * (cart[product.id] ?? 0), 0);
  return <div className="overlay"><aside className="cart-drawer">
    <div className="drawer-head"><div><span className="eyebrow-small">seu ritual</span><h2>Minha sacola <span>{items.reduce((sum, item) => sum + (cart[item.id] ?? 0), 0)}</span></h2></div><button className="close-button" onClick={onClose} aria-label="Fechar sacola"><X size={20} /></button></div>
    {items.length === 0 ? <div className="empty-state"><div className="empty-icon"><ShoppingBag size={24} /></div><h3>Sua sacola está leve.</h3><p>Adicione um essencial para começar seu próximo ritual.</p><button className="button button-dark" onClick={onClose}>ver produtos <ArrowRight size={16} /></button></div> : <>
      <div className="cart-items">{items.map(product => <div className="cart-item" key={product.id}><ProductVisual product={product} compact /><div className="cart-item-info"><div className="cart-item-title"><div><span>{product.category}</span><h3>{product.name}</h3></div><strong>{formatCurrency(product.price * (cart[product.id] ?? 0))}</strong></div><div className="quantity"><button onClick={() => onChange(product.id, -1)} aria-label="Diminuir"><Minus size={13} /></button><span>{cart[product.id]}</span><button onClick={() => onChange(product.id, 1)} aria-label="Aumentar"><Plus size={13} /></button></div></div></div>)}</div>
      <div className="cart-summary"><div><span>Subtotal</span><strong>{formatCurrency(subtotal)}</strong></div><div><span>Frete</span><span className="summary-muted">calculado no checkout</span></div><div className="summary-total"><span>Total estimado</span><strong>{formatCurrency(subtotal)}</strong></div><button className="button button-dark button-wide" onClick={onCheckout}>continuar para checkout <ArrowRight size={16} /></button><p className="safe-note"><LockKeyhole size={13} /> ambiente demonstrativo e seguro</p></div>
    </>}
  </aside></div>;
}

function Checkout({ cart, products, onClose, onClear }: { cart: Cart; products: Product[]; onClose: () => void; onClear: () => void }) {
  const [step, setStep] = useState<"address" | "payment" | "success">("address");
  const [address, setAddress] = useState({ name: "", cep: "", street: "", number: "", city: "São Paulo", state: "SP" });
  const [shipping, setShipping] = useState<ReturnType<typeof calculateShipping>>(null);
  const [payment, setPayment] = useState("pix");
  const [order, setOrder] = useState("");
  const items = products.filter(product => cart[product.id]);
  const subtotal = items.reduce((sum, product) => sum + product.price * (cart[product.id] ?? 0), 0);
  const total = subtotal + (shipping?.price ?? 0);
  const updateAddress = (key: keyof typeof address, value: string) => setAddress(prev => ({ ...prev, [key]: value }));
  const calculate = () => {
    const result = calculateShipping(address.cep);
    if (!result) { toast.error("Digite um CEP válido com 8 números."); return; }
    if (!address.name || !address.street || !address.number) { toast.error("Preencha nome, rua e número para calcular."); return; }
    setShipping(result); toast.success(`Entrega para ${result.label} encontrada.`);
  };
  const finish = () => { if (!shipping) { toast.error("Calcule o frete antes de confirmar."); return; } setOrder(createOrderCode()); setStep("success"); onClear(); };
  return <div className="overlay checkout-overlay"><div className="checkout-modal">
    <div className="checkout-top"><div className="checkout-brand"><span className="wordmark-mark">⌒</span>lumera <span>checkout demonstrativo</span></div><button className="close-button" onClick={onClose} aria-label="Fechar checkout"><X size={20} /></button></div>
    {step !== "success" && <div className="checkout-steps"><div className={step === "address" ? "active" : "done"}><span>01</span> entrega</div><div className={step === "payment" ? "active" : ""}><span>02</span> pagamento</div><div><span>03</span> confirmação</div></div>}
    {step === "address" && <div className="checkout-body"><div className="checkout-main"><div className="checkout-heading"><div><span className="eyebrow-small">onde entregar</span><h2>Seu endereço</h2></div><span className="step-count">1 de 2</span></div><div className="form-grid"><label className="field field-span-2"><span>Nome completo</span><input value={address.name} onChange={e => updateAddress("name", e.target.value)} placeholder="Como podemos te chamar?" /></label><label className="field"><span>CEP</span><input value={address.cep} onChange={e => updateAddress("cep", e.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="00000-000" inputMode="numeric" /></label><label className="field"><span>Cidade</span><input value={address.city} onChange={e => updateAddress("city", e.target.value)} /></label><label className="field field-span-2"><span>Rua e avenida</span><input value={address.street} onChange={e => updateAddress("street", e.target.value)} placeholder="Ex.: Rua das Flores" /></label><label className="field"><span>Número</span><input value={address.number} onChange={e => updateAddress("number", e.target.value)} placeholder="123" /></label><label className="field"><span>Estado</span><select value={address.state} onChange={e => updateAddress("state", e.target.value)}><option>SP</option><option>RJ</option><option>MG</option><option>PR</option><option>BA</option><option>RS</option></select></label></div><div className="shipping-box"><div className="shipping-box-icon"><Truck size={18} /></div><div><strong>Calcule sua entrega</strong><p>Usamos o CEP apenas para esta simulação.</p></div><button className="button button-outline" onClick={calculate}>calcular frete</button></div>{shipping && <div className="shipping-result"><div><Check size={15} /><span><b>{shipping.label}</b> · {shipping.days}</span></div><strong>{shipping.price === 0 ? "grátis" : formatCurrency(shipping.price)}</strong></div>}</div><OrderSummary items={items} cart={cart} subtotal={subtotal} shipping={shipping} total={total} action={<button className="button button-dark button-wide" onClick={() => shipping ? setStep("payment") : calculate()}>ir para pagamento <ArrowRight size={16} /></button>} /></div>}
    {step === "payment" && <div className="checkout-body"><div className="checkout-main"><div className="checkout-heading"><div><span className="eyebrow-small">ambiente seguro de teste</span><h2>Como prefere pagar?</h2></div><span className="step-count">2 de 2</span></div><div className="payment-notice"><Zap size={17} /><div><strong>Pagamento 100% simulado</strong><p>Nenhum dado é enviado ou cobrado. Ideal para apresentação.</p></div></div><div className="payment-options">{[{ id: "pix", label: "Pix", detail: "Aprovação imediata", icon: <span className="pix-icon">◈</span> }, { id: "card", label: "Cartão de crédito", detail: "Até 3x sem juros", icon: <CreditCard size={20} /> }, { id: "boleto", label: "Boleto bancário", detail: "Vencimento em 2 dias", icon: <span className="boleto-icon">▤</span> }].map(option => <button key={option.id} className={`payment-option ${payment === option.id ? "selected" : ""}`} onClick={() => setPayment(option.id)}><span className="payment-icon">{option.icon}</span><span><b>{option.label}</b><small>{option.detail}</small></span><span className="radio-dot" /></button>)}</div><div className="fake-card-fields">{payment === "card" && <><label className="field field-span-2"><span>Número do cartão (simulação)</span><input placeholder="0000 0000 0000 0000" /></label><label className="field"><span>Validade</span><input placeholder="MM/AA" /></label><label className="field"><span>CVV</span><input placeholder="000" /></label></>}</div><div className="checkout-back"><button onClick={() => setStep("address")}><ChevronLeft size={16} /> voltar para endereço</button></div><button className="button button-dark button-wide" onClick={finish}>confirmar pedido simulado <Check size={16} /></button></div><OrderSummary items={items} cart={cart} subtotal={subtotal} shipping={shipping} total={total} action={<div className="mini-trust"><LockKeyhole size={14} /> seus dados ficam só nesta demonstração</div>} /></div>}
    {step === "success" && <div className="success-state"><div className="success-mark"><Check size={29} /></div><span className="eyebrow-small">pedido recebido</span><h2>Pronto para apresentar.</h2><p>O pedido <strong>{order}</strong> foi criado em ambiente de teste. Nenhum pagamento foi processado.</p><div className="success-details"><div><PackageCheck size={17} /><span>Entrega estimada<br /><b>{shipping?.days ?? "3 a 5 dias úteis"}</b></span></div><div><CreditCard size={17} /><span>Pagamento<br /><b>{payment === "pix" ? "Pix simulado" : payment === "card" ? "Cartão simulado" : "Boleto simulado"}</b></span></div></div><button className="button button-dark" onClick={onClose}>voltar para a loja <ArrowRight size={16} /></button></div>}
  </div></div>;
}

function OrderSummary({ items, cart, subtotal, shipping, total, action }: { items: Product[]; cart: Cart; subtotal: number; shipping: ReturnType<typeof calculateShipping>; total: number; action: React.ReactNode }) {
  return <aside className="order-summary"><span className="eyebrow-small">resumo do pedido</span><div className="summary-products">{items.map(product => <div key={product.id}><span className="summary-thumb"><ProductVisual product={product} compact /></span><span><b>{product.name}</b><small>qtd. {cart[product.id]}</small></span><strong>{formatCurrency(product.price * (cart[product.id] ?? 0))}</strong></div>)}</div><div className="summary-lines"><div><span>Subtotal</span><b>{formatCurrency(subtotal)}</b></div><div><span>Entrega</span><b>{shipping ? formatCurrency(shipping.price) : "—"}</b></div><div className="summary-final"><span>Total</span><strong>{formatCurrency(total)}</strong></div></div>{action}</aside>;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>(() => loadProducts());
  const [cart, setCart] = useState<Cart>(() => loadCart());
  const [activeCategory, setActiveCategory] = useState<(typeof categories)[number]>("Todos");
  const [search, setSearch] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  useEffect(() => { const sync = () => setProducts(loadProducts()); window.addEventListener("lumera-products-updated", sync); return () => window.removeEventListener("lumera-products-updated", sync); }, []);
  useEffect(() => saveCart(cart), [cart]);
  const visibleProducts = useMemo(() => products.filter(product => (activeCategory === "Todos" || product.category === activeCategory) && `${product.name} ${product.description}`.toLowerCase().includes(search.toLowerCase())), [products, activeCategory, search]);
  const cartCount = Object.values(cart).reduce((sum, count) => sum + count, 0);
  const addToCart = (product: Product) => { setCart(prev => ({ ...prev, [product.id]: (prev[product.id] ?? 0) + 1 })); toast.success(`${product.name} entrou na sua sacola.`); };
  const changeCart = (id: string, delta: number) => setCart(prev => { const next = { ...prev, [id]: Math.max(0, (prev[id] ?? 0) + delta) }; if (!next[id]) delete next[id]; return next; });
  const scrollToProducts = () => document.getElementById("novidades")?.scrollIntoView({ behavior: "smooth" });
  return <div className="storefront"><Header count={cartCount} onCart={() => setCartOpen(true)} /><main><Hero onExplore={scrollToProducts} /><section className="manifesto container" id="manifesto"><div className="manifesto-label"><span className="eyebrow-small">por que lumera</span><span className="manifesto-number">/ 01</span></div><div className="manifesto-copy"><p>Uma curadoria menor, mais consciente e feita para ser usada até o fim.</p><a href="#novidades">conheça nossos essenciais <ArrowRight size={15} /></a></div><div className="manifesto-stamp"><Sparkles size={17} /><span>clean<br />beauty</span></div></section><section className="collection container" id="novidades"><div className="section-heading"><div><span className="eyebrow-small">a coleção essencial</span><h2>Escolhas para o seu ritual.</h2></div><div className="collection-controls"><label className="search-field"><Search size={16} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="buscar produto" /></label><div className="category-tabs">{categories.map(category => <button key={category} className={activeCategory === category ? "active" : ""} onClick={() => setActiveCategory(category)}>{category}</button>)}</div></div></div>{visibleProducts.length > 0 ? <div className="product-grid">{visibleProducts.map(product => <ProductCard key={product.id} product={product} onAdd={addToCart} />)}</div> : <div className="catalog-empty"><Search size={22} /><h3>Nenhum essencial encontrado.</h3><button onClick={() => { setSearch(""); setActiveCategory("Todos"); }}>limpar busca</button></div>}</section><section className="ritual-banner container"><div><span className="eyebrow-small">o ritual lumera</span><h2>Menos etapas.<br /><em>Mais presença.</em></h2></div><p>Produtos feitos para combinar entre si, respeitar seu tempo e deixar a pele respirar.</p><div className="ritual-art"><div className="ritual-circle" /><span>l</span></div></section><section className="service-strip container"><div><Truck size={19} /><span><b>entrega descomplicada</b><small>frete calculado pelo seu CEP</small></span></div><div><ShieldCheck size={19} /><span><b>fórmulas conscientes</b><small>veganas e cruelty-free</small></span></div><div><CircleHelp size={19} /><span><b>precisa de ajuda?</b><small>fale com nosso ritualista</small></span></div></section></main><footer className="site-footer"><div className="container footer-main"><div><Link href="/" className="wordmark"><span className="wordmark-mark">⌒</span>lumera</Link><p>O essencial, em sua melhor forma.</p></div><div className="footer-links"><div><span>explore</span><a href="#novidades">novidades</a><a href="#novidades">essenciais</a><a href="#manifesto">manifesto</a></div><div><span>atendimento</span><a href="#">trocas e devoluções</a><a href="#">envios</a><a href="#">fale conosco</a></div><div><span>acompanhe</span><a href="#">instagram</a><a href="#">pinterest</a><Link href="/admin">painel admin</Link></div></div></div><div className="container footer-bottom"><span>© 2026 lumera</span><span>feito para rituais reais.</span></div></footer>{cartOpen && <CartDrawer cart={cart} products={products} onClose={() => setCartOpen(false)} onChange={changeCart} onCheckout={() => { setCartOpen(false); setCheckoutOpen(true); }} />}{checkoutOpen && <Checkout cart={cart} products={products} onClose={() => setCheckoutOpen(false)} onClear={() => setCart({})} />}</div>;
}
