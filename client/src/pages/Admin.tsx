import { ProductVisual } from "@/components/ProductVisual";
import { categories, formatCurrency, loadProducts, saveProducts, type Category, type Product } from "@/lib/store";
import { ArrowLeft, BarChart3, Check, Edit3, Eye, LayoutGrid, Package, Plus, Search, Settings2, ShoppingBag, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

const categoryLabels: Record<Exclude<Category, never> | "Todos", string> = {
  Todos: "Todas",
  Face: "Rosto",
  Body: "Corpo",
  Hair: "Cabelos",
  Fragrance: "Fragrâncias",
  Makeup: "Maquiagem",
};

const emptyForm: Omit<Product, "id"> = {
  name: "",
  category: "Face",
  price: 0,
  description: "",
  stock: 0,
  accent: "olive",
  note: "Ingrediente principal",
};

function AdminSidebar({ active, count }: { active: string; count: number }) {
  return <aside className="admin-sidebar">
    <Link href="/" className="admin-logo"><span className="wordmark-mark">⌒</span>lumera<span className="admin-logo-sub">Studio</span></Link>
    <div className="admin-workspace"><span className="workspace-dot" /><span><b>Loja principal</b><small>Ambiente de demonstração</small></span></div>
    <nav className="admin-nav"><span className="admin-nav-label">Gestão</span><a className={active === "overview" ? "active" : ""} href="#overview"><LayoutGrid size={17} />Visão geral</a><a className={active === "products" ? "active" : ""} href="#products"><Package size={17} />Produtos <span className="nav-count">{count}</span></a><a href="#orders"><ShoppingBag size={17} />Pedidos <span className="nav-pill">Demo</span></a><span className="admin-nav-label admin-nav-label-spaced">Configurações</span><a href="#settings"><Settings2 size={17} />Preferências</a></nav>
    <div className="admin-sidebar-footer"><div className="admin-avatar">LM</div><div><b>Loja Lumera</b><small>Administrador</small></div><button aria-label="Mais opções">•••</button></div>
  </aside>;
}

function ProductForm({ product, onCancel, onSave }: { product: Product | null; onCancel: () => void; onSave: (product: Omit<Product, "id">) => void }) {
  const [form, setForm] = useState<Omit<Product, "id">>(product ? { name: product.name, category: product.category, price: product.price, oldPrice: product.oldPrice, badge: product.badge, description: product.description, stock: product.stock, accent: product.accent, note: product.note } : emptyForm);
  const update = (key: keyof typeof form, value: string | number) => setForm(prev => ({ ...prev, [key]: value }));
  const save = () => {
    if (!form.name.trim() || !form.price || !form.description.trim()) {
      toast.error("Preencha nome, preço e descrição.");
      return;
    }
    onSave({ ...form, name: form.name.trim(), description: form.description.trim(), note: form.note.trim() || "Ingrediente principal" });
  };
  return <div className="admin-form-panel">
    <div className="admin-panel-head"><div><span className="eyebrow-small">{product ? "Editar item" : "Novo item"}</span><h2>{product ? "Atualizar produto" : "Adicionar produto"}</h2></div><button className="close-button" onClick={onCancel} aria-label="Fechar formulário"><X size={19} /></button></div>
    <div className="admin-form-preview"><ProductVisual product={{ id: "preview", ...form, name: form.name || "Novo produto", category: form.category as Category }} /><div><span>Pré-visualização</span><strong>{form.name || "Nome do produto"}</strong><small>Assim o produto aparece na vitrine</small></div></div>
    <div className="admin-fields">
      <label className="field"><span>Nome do produto</span><input value={form.name} onChange={e => update("name", e.target.value)} placeholder="Ex.: Creme de mãos" autoFocus /></label>
      <div className="field-row"><label className="field"><span>Categoria</span><select value={form.category} onChange={e => update("category", e.target.value)}>{categories.filter(category => category !== "Todos").map(category => <option key={category} value={category}>{categoryLabels[category]}</option>)}</select></label><label className="field"><span>Preço (R$)</span><input type="number" min="0" step="0.01" value={form.price || ""} onChange={e => update("price", Number(e.target.value))} placeholder="0,00" /></label></div>
      <div className="field-row"><label className="field"><span>Estoque</span><input type="number" min="0" value={form.stock} onChange={e => update("stock", Number(e.target.value))} /></label><label className="field"><span>Selo de destaque</span><input value={form.badge ?? ""} onChange={e => update("badge", e.target.value)} placeholder="Novo, Ritual..." /></label></div>
      <label className="field"><span>Nota olfativa ou ingrediente</span><input value={form.note} onChange={e => update("note", e.target.value)} placeholder="Ex.: Aloe + chá branco" /></label>
      <label className="field"><span>Descrição curta</span><textarea value={form.description} onChange={e => update("description", e.target.value)} placeholder="Descreva a sensação e os ativos principais." rows={3} /></label>
      <div className="field"><span>Cor da embalagem</span><div className="color-options">{(["olive", "clay", "sand", "rose", "ink"] as const).map(color => <button key={color} type="button" className={`color-option color-${color} ${form.accent === color ? "selected" : ""}`} onClick={() => update("accent", color)} aria-label={`Selecionar cor ${color}`} />)}</div></div>
    </div>
    <div className="admin-form-actions"><button className="button button-quiet" onClick={onCancel}>Cancelar</button><button className="button button-dark" onClick={save}>{product ? "Salvar alterações" : "Adicionar produto"} <Check size={16} /></button></div>
  </div>;
}

export default function Admin() {
  const [, setLocation] = useLocation();
  const [products, setProducts] = useState<Product[]>(() => loadProducts());
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [active] = useState("products");
  const filtered = useMemo(() => products.filter(product => `${product.name} ${categoryLabels[product.category]}`.toLowerCase().includes(query.toLowerCase())), [products, query]);
  const inventoryValue = products.reduce((sum, product) => sum + product.price * product.stock, 0);
  const save = (payload: Omit<Product, "id">) => {
    const next = editing ? products.map(product => product.id === editing.id ? { ...payload, id: editing.id } : product) : [...products, { ...payload, id: `product-${Date.now()}` }];
    setProducts(next); saveProducts(next); setFormOpen(false); setEditing(null); toast.success(editing ? "Produto atualizado com sucesso." : "Produto adicionado à vitrine.");
  };
  const remove = (product: Product) => {
    if (!window.confirm(`Remover “${product.name}” da vitrine?`)) return;
    const next = products.filter(item => item.id !== product.id); setProducts(next); saveProducts(next); toast.success("Produto removido da vitrine.");
  };
  return <div className="admin-shell"><AdminSidebar active={active} count={products.length} /><main className="admin-main">
    <header className="admin-header"><div className="admin-breadcrumb"><button onClick={() => setLocation("/")}><ArrowLeft size={16} /> Voltar à loja</button><span>/</span><b>Produtos</b></div><div className="admin-header-actions"><span className="demo-status"><span /> Dados salvos localmente</span><button className="icon-button" aria-label="Visualizar vitrine"><Eye size={18} /></button><button className="admin-profile"><span className="admin-avatar">LM</span><ChevronDownIcon /></button></div></header>
    <div className="admin-content" id="overview"><div className="admin-title-row"><div><span className="eyebrow-small">Lumera Studio / Catálogo</span><h1>Olá, loja Lumera.</h1><p>Acompanhe sua vitrine e mantenha o essencial em movimento.</p></div><button className="button button-dark" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus size={17} /> Novo produto</button></div>
      <div className="stats-grid"><div className="stat-card"><div className="stat-icon olive"><Package size={18} /></div><span>Produtos ativos</span><strong>{products.length}</strong><small><span className="positive">+{products.length ? 100 : 0}%</span> Catálogo preenchido</small></div><div className="stat-card"><div className="stat-icon clay"><BarChart3 size={18} /></div><span>Valor em estoque</span><strong>{formatCurrency(inventoryValue)}</strong><small>Baseado no estoque atual</small></div><div className="stat-card"><div className="stat-icon sand"><ShoppingBag size={18} /></div><span>Pedidos simulados</span><strong>24</strong><small><span className="positive">+12,5%</span> Vs. mês anterior</small></div><div className="stat-card"><div className="stat-icon rose"><SparklineIcon /></div><span>Conversão estimada</span><strong>4,8%</strong><small><span className="positive">+0,6%</span> Esta semana</small></div></div>
      <section className="admin-section" id="products"><div className="admin-section-head"><div><span className="eyebrow-small">Catálogo da loja</span><h2>Todos os produtos <span>{products.length}</span></h2></div><div className="admin-list-tools"><label className="search-field"><Search size={16} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar produto" /></label><button className="filter-button">Filtros <span>0</span></button></div></div><div className="product-table"><div className="table-head"><span>Produto</span><span>Categoria</span><span>Preço</span><span>Estoque</span><span>Status</span><span /></div>{filtered.length === 0 ? <div className="admin-empty"><Package size={21} /><h3>Nenhum produto encontrado.</h3><p>Tente outro termo ou adicione um novo item.</p></div> : filtered.map(product => <div className="table-row" key={product.id}><div className="table-product"><ProductVisual product={product} compact /><div><strong>{product.name}</strong><small>ID {product.id}</small></div></div><span className="table-category">{categoryLabels[product.category]}</span><strong className="table-price">{formatCurrency(product.price)}</strong><span className={product.stock < 10 ? "stock-low" : "stock-ok"}>{product.stock} un.</span><span><span className="status-active"><span /> Ativo</span></span><div className="table-actions"><button onClick={() => { setEditing(product); setFormOpen(true); }} aria-label={`Editar ${product.name}`}><Edit3 size={16} /></button><button onClick={() => remove(product)} aria-label={`Remover ${product.name}`}><Trash2 size={16} /></button></div></div>)}</div></section>
      <section className="admin-tip"><div className="tip-icon"><SparklineIcon /></div><div><strong>Dica para sua demonstração</strong><p>Adicione um produto novo, altere o preço e volte à vitrine. As mudanças são salvas neste navegador e aparecem instantaneamente na loja.</p></div><button onClick={() => setLocation("/")}>Ver vitrine <ArrowLeft size={15} /></button></section>
    </div></main>{formOpen && <div className="overlay"><ProductForm product={editing} onCancel={() => { setFormOpen(false); setEditing(null); }} onSave={save} /></div>}</div>;
}

function ChevronDownIcon() { return <span className="chevron-down">⌄</span>; }
function SparklineIcon() { return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M2 13.5 6.2 9.3l2.7 2.7L15.8 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /><path d="M12.2 5H16v3.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
