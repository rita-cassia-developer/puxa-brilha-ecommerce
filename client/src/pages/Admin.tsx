import { ProductVisual } from "@/components/ProductVisual";
import { categories, formatCurrency, type Category, type Product } from "@/lib/store";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, BarChart3, Check, Edit3, Eye, LayoutGrid, LoaderCircle, Package, Plus, Search, Settings2, ShoppingBag, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

const categoryLabels: Record<Exclude<Category, never> | "Todos", string> = { Todos: "Todas", Wax: "Cera de depilação" };

const emptyForm: Omit<Product, "id"> = {
  name: "",
  category: "Wax",
  price: 0,
  weightKg: 1.4,
  description: "",
  stock: 0,
  accent: "olive",
  note: "Ingrediente principal",
};

function AdminSidebar({ active, count }: { active: string; count: number }) {
  return <aside className="admin-sidebar">
    <Link href="/" className="admin-logo"><span className="wordmark-mark">⌒</span>yaffa<span className="admin-logo-sub">Studio</span></Link>
    <div className="admin-workspace"><span className="workspace-dot" /><span><b>Loja principal</b><small>Ambiente de demonstração</small></span></div>
    <nav className="admin-nav"><span className="admin-nav-label">Gestão</span><a className={active === "overview" ? "active" : ""} href="#overview"><LayoutGrid size={17} />Visão geral</a><a className={active === "products" ? "active" : ""} href="#products"><Package size={17} />Produtos <span className="nav-count">{count}</span></a><a href="#orders"><ShoppingBag size={17} />Pedidos <span className="nav-pill">Demo</span></a><span className="admin-nav-label admin-nav-label-spaced">Configurações</span><a href="#settings"><Settings2 size={17} />Preferências</a></nav>
    <div className="admin-sidebar-footer"><div className="admin-avatar">YF</div><div><b>Loja Yaffa Cosméticos</b><small>Administrador</small></div><button aria-label="Mais opções">•••</button></div>
  </aside>;
}

function ProductForm({ product, onCancel, onSave }: { product: Product | null; onCancel: () => void; onSave: (product: Omit<Product, "id">) => void }) {
  const [form, setForm] = useState<Omit<Product, "id">>(product ? { name: product.name, category: product.category, price: product.price, weightKg: product.weightKg, oldPrice: product.oldPrice, badge: product.badge, description: product.description, stock: product.stock, accent: product.accent, note: product.note } : emptyForm);
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
      <div className="field-row"><label className="field"><span>Peso (kg)</span><input type="number" min="0" step="0.1" value={form.weightKg ?? ""} onChange={e => update("weightKg", Number(e.target.value))} placeholder="1,4" /></label><label className="field"><span>Estoque</span><input type="number" min="0" value={form.stock} onChange={e => update("stock", Number(e.target.value))} /></label><label className="field"><span>Selo de destaque</span><input value={form.badge ?? ""} onChange={e => update("badge", e.target.value)} placeholder="Novo, Ritual..." /></label></div>
      <label className="field"><span>Nota olfativa ou ingrediente</span><input value={form.note} onChange={e => update("note", e.target.value)} placeholder="Ex.: Aloe + chá branco" /></label>
      <label className="field"><span>Descrição curta</span><textarea value={form.description} onChange={e => update("description", e.target.value)} placeholder="Descreva a sensação e os ativos principais." rows={3} /></label>
      <div className="field"><span>Cor da embalagem</span><div className="color-options">{(["rose", "sand", "clay", "olive", "ink"] as const).map(color => <button key={color} type="button" className={`color-option color-${color} ${form.accent === color ? "selected" : ""}`} onClick={() => update("accent", color)} aria-label={`Selecionar cor ${color}`} />)}</div></div>
    </div>
    <div className="admin-form-actions"><button className="button button-quiet" onClick={onCancel}>Cancelar</button><button className="button button-dark" onClick={save}>{product ? "Salvar alterações" : "Adicionar produto"} <Check size={16} /></button></div>
  </div>;
}

export default function Admin() {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [active] = useState("products");
  const productsQuery = trpc.products.list.useQuery({ search: query || undefined }, { retry: false });
  const ordersQuery = trpc.orders.list.useQuery(undefined, { retry: false });
  const createProduct = trpc.products.create.useMutation({ onSuccess: () => productsQuery.refetch() });
  const updateProduct = trpc.products.update.useMutation({ onSuccess: () => productsQuery.refetch() });
  const removeProduct = trpc.products.remove.useMutation({ onSuccess: () => productsQuery.refetch() });
  const orders = ordersQuery.data ?? [];
  const products: Product[] = (productsQuery.data ?? []).map(row => ({
    id: String(row.id), name: row.name, category: "Wax", price: Number(row.price), oldPrice: row.oldPrice == null ? undefined : Number(row.oldPrice),
    badge: row.badge ?? undefined, description: row.description, stock: row.stock, weightKg: row.weightGrams / 1000,
    accent: (row.accent as Product["accent"]) || "rose", note: row.note || "Cera depilatória profissional",
  }));
  const inventoryValue = products.reduce((sum, product) => sum + product.price * product.stock, 0);
  const save = async (payload: Omit<Product, "id">) => {
    const input = { name: payload.name, category: payload.category, description: payload.description, price: payload.price, oldPrice: payload.oldPrice ?? null, badge: payload.badge ?? null, accent: payload.accent, note: payload.note ?? null, stock: payload.stock, weightGrams: Math.round((payload.weightKg ?? 1.4) * 1000), status: "active" as const };
    try {
      if (editing) await updateProduct.mutateAsync({ ...input, id: Number(editing.id) });
      else await createProduct.mutateAsync(input);
      setFormOpen(false); setEditing(null); toast.success(editing ? "Produto atualizado no banco." : "Produto adicionado ao catálogo.");
    } catch { toast.error("Não foi possível salvar o produto. Tente novamente."); }
  };
  const remove = async (product: Product) => {
    if (!window.confirm(`Remover “${product.name}” da vitrine?`)) return;
    try { await removeProduct.mutateAsync({ id: Number(product.id) }); toast.success("Produto removido do banco."); }
    catch { toast.error("Não foi possível remover este produto."); }
  };
  if (productsQuery.isLoading) return <div className="auth-gate"><LoaderCircle className="auth-spinner" size={26} /><p>Carregando catálogo seguro…</p></div>;
  if (productsQuery.isError) return <div className="auth-gate"><div className="auth-gate-card"><div className="auth-gate-icon"><Package size={22} /></div><h1>Catálogo indisponível</h1><p>Não foi possível consultar o banco de dados neste momento.</p><button className="auth-gate-button" onClick={() => productsQuery.refetch()}>Tentar novamente</button></div></div>;
  return <div className="admin-shell"><AdminSidebar active={active} count={products.length} /><main className="admin-main">
    <header className="admin-header"><div className="admin-breadcrumb"><button onClick={() => setLocation("/")}><ArrowLeft size={16} /> Voltar à loja</button><span>/</span><b>Produtos</b></div><div className="admin-header-actions"><span className="demo-status"><span /> Dados salvos no banco</span><button className="icon-button" aria-label="Visualizar vitrine" onClick={() => setLocation("/")}><Eye size={18} /></button><button className="admin-profile"><span className="admin-avatar">YF</span><ChevronDownIcon /></button></div></header>
    <div className="admin-content" id="overview"><div className="admin-title-row"><div><span className="eyebrow-small">Yaffa Cosméticos Studio / Catálogo</span><h1>Olá, loja Yaffa Cosméticos.</h1><p>Produtos cadastrados no banco de dados oficial da loja.</p></div><button className="button button-dark" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus size={17} /> Novo produto</button></div>
      <div className="stats-grid"><div className="stat-card"><div className="stat-icon olive"><Package size={18} /></div><span>Produtos ativos</span><strong>{products.length}</strong><small><span className="positive">Banco real</span> Catálogo persistente</small></div><div className="stat-card"><div className="stat-icon clay"><BarChart3 size={18} /></div><span>Valor em estoque</span><strong>{formatCurrency(inventoryValue)}</strong><small>Baseado no estoque atual</small></div><div className="stat-card"><div className="stat-icon sand"><ShoppingBag size={18} /></div><span>Pedidos</span><strong>{orders.length}</strong><small>Pedidos persistidos no banco</small></div><div className="stat-card"><div className="stat-icon rose"><SparklineIcon /></div><span>Leads</span><strong>0</strong><small>Captação será ativada na Fase 2</small></div></div>
      <section className="admin-section" id="products"><div className="admin-section-head"><div><span className="eyebrow-small">Catálogo persistente</span><h2>Todos os produtos <span>{products.length}</span></h2></div><div className="admin-list-tools"><label className="search-field"><Search size={16} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar produto" /></label><button className="filter-button">Filtros <span>0</span></button></div></div><div className="product-table"><div className="table-head"><span>Produto</span><span>Categoria</span><span>Preço</span><span>Estoque</span><span>Status</span><span /></div>{products.length === 0 ? <div className="admin-empty"><Package size={21} /><h3>Nenhum produto encontrado.</h3><p>Adicione o primeiro produto ao banco da Yaffa.</p></div> : products.map(product => <div className="table-row" key={product.id}><div className="table-product"><ProductVisual product={product} compact /><div><strong>{product.name}</strong><small>ID {product.id}</small></div></div><span className="table-category">{categoryLabels[product.category]}</span><strong className="table-price">{formatCurrency(product.price)}</strong><span className={product.stock < 10 ? "stock-low" : "stock-ok"}>{product.stock} un.</span><span><span className="status-active"><span /> Ativo</span></span><div className="table-actions"><button onClick={() => { setEditing(product); setFormOpen(true); }} aria-label={`Editar ${product.name}`}><Edit3 size={16} /></button><button onClick={() => remove(product)} aria-label={`Remover ${product.name}`}><Trash2 size={16} /></button></div></div>)}</div></section>
      <section className="admin-section admin-orders-section" id="orders"><div className="admin-section-head"><div><span className="eyebrow-small">Vendas registradas</span><h2>Pedidos <span>{orders.length}</span></h2></div><span className="orders-live-status"><span /> Atualizado do banco</span></div><div className="admin-orders-list">{orders.length === 0 ? <div className="admin-empty"><ShoppingBag size={21} /><h3>Nenhum pedido registrado.</h3><p>Quando um cliente confirmar o checkout, o pedido aparecerá aqui.</p></div> : orders.map(order => <article className="admin-order-row" key={order.id}><div><strong>{order.code}</strong><small>{order.customerName} · {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(order.createdAt))}</small></div><div><span className="order-label">Pagamento</span><b>{order.paymentMethod === "pix" ? "Pix" : order.paymentMethod === "card" ? "Cartão" : order.paymentMethod === "boleto" ? "Boleto" : "Link"}</b></div><div><span className="order-label">Recebimento</span><b>{order.fulfillment === "pickup" ? "Retirada" : "Entrega"}</b></div><div><span className="order-label">Total</span><b>{formatCurrency(Number(order.total))}</b></div><span className="order-status"><span /> {order.paymentStatus === "pending" ? "Pagamento pendente" : order.paymentStatus}</span></article>)}</div></section>
      <section className="admin-tip"><div className="tip-icon"><SparklineIcon /></div><div><strong>Catálogo persistente</strong><p>As alterações agora ficam salvas no banco e poderão ser acessadas pela proprietária em outros dispositivos.</p></div><button onClick={() => setLocation("/")}>Ver vitrine <ArrowLeft size={15} /></button></section>
    </div></main>{formOpen && <div className="overlay"><ProductForm product={editing} onCancel={() => { setFormOpen(false); setEditing(null); }} onSave={save} /></div>}</div>;
}
function ChevronDownIcon() { return <span className="chevron-down">⌄</span>; }
function SparklineIcon() { return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M2 13.5 6.2 9.3l2.7 2.7L15.8 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /><path d="M12.2 5H16v3.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
