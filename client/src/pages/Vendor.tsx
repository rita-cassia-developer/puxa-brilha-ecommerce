import { Link } from "wouter";
import { ArrowLeft, BarChart3, Copy, ExternalLink, LoaderCircle, ShoppingBag, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/store";
import { startLogin } from "@/const";

export default function Vendor() {
  const auth = trpc.auth.me.useQuery();
  const dashboard = trpc.partners.dashboard.useQuery(undefined, { enabled: auth.data?.role === "vendor" || auth.data?.role === "admin", retry: false });
  if (auth.isLoading) return <div className="auth-gate"><LoaderCircle className="auth-spinner" size={26} /><p>Verificando acesso…</p></div>;
  if (!auth.data) return <div className="auth-gate"><div className="auth-gate-card"><h1>Área do vendedor</h1><p>Entre com sua conta para consultar seus resultados.</p><button className="auth-gate-button" onClick={startLogin}>Entrar</button></div></div>;
  if (auth.data.role !== "vendor" && auth.data.role !== "admin") return <div className="auth-gate"><div className="auth-gate-card"><h1>Acesso restrito</h1><p>Esta área é exclusiva para vendedores cadastrados.</p><Link href="/" className="auth-gate-button">Voltar à loja</Link></div></div>;
  if (dashboard.isLoading) return <div className="auth-gate"><LoaderCircle className="auth-spinner" size={26} /><p>Carregando seu desempenho…</p></div>;
  const data = dashboard.data;
  if (!data) return <div className="auth-gate"><div className="auth-gate-card"><h1>Perfil não encontrado</h1><p>Solicite ao administrador o vínculo do seu perfil de vendedor.</p><Link href="/" className="auth-gate-button">Voltar à loja</Link></div></div>;
  const sold = data.orders.reduce((sum, order) => sum + Number(order.total), 0);
  const commission = data.commissions.reduce((sum, item) => sum + Number(item.amount), 0);
  const referralUrl = `${window.location.origin}/?ref=${data.links[0]?.code ?? ""}`;
  return <main className="vendor-page"><header className="vendor-header"><Link href="/" className="admin-breadcrumb"><ArrowLeft size={16} /> Voltar à loja</Link><span className="vendor-brand">yaffa <small>parceiros</small></span><Link href="/admin" className="button button-quiet">Painel administrativo</Link></header><div className="vendor-content"><span className="eyebrow-small">Portal do vendedor</span><h1>Olá, {data.vendor.displayName}.</h1><p className="vendor-intro">Compartilhe seu link e acompanhe cada oportunidade gerada.</p><div className="vendor-stats"><div><Users size={18}/><span>Leads</span><strong>{data.leads.length}</strong></div><div><ShoppingBag size={18}/><span>Pedidos</span><strong>{data.orders.length}</strong></div><div><BarChart3 size={18}/><span>Vendas</span><strong>{formatCurrency(sold)}</strong></div><div><span className="commission-symbol">%</span><span>Comissões</span><strong>{formatCurrency(commission)}</strong></div></div><section className="vendor-link-card"><div><span className="eyebrow-small">Seu link de indicação</span><h2>{data.links[0]?.code ?? "Ainda não criado"}</h2><p>{referralUrl}</p></div><button className="button button-dark" onClick={() => navigator.clipboard?.writeText(referralUrl)}><Copy size={16}/> Copiar link</button></section><section className="vendor-lists"><div className="vendor-list-card"><h2>Leads recentes</h2>{data.leads.length ? data.leads.slice(0, 10).map(lead => <div className="vendor-list-row" key={lead.id}><div><strong>{lead.source ?? "Indicação"}</strong><small>{lead.status}</small></div><span>{new Date(lead.createdAt).toLocaleDateString("pt-BR")}</span></div>) : <p>Nenhum lead registrado ainda.</p>}</div><div className="vendor-list-card"><h2>Pedidos indicados</h2>{data.orders.length ? data.orders.slice(0, 10).map(order => <div className="vendor-list-row" key={order.id}><div><strong>{order.code}</strong><small>{order.orderStatus}</small></div><span>{formatCurrency(Number(order.total))}</span></div>) : <p>Nenhum pedido indicado ainda.</p>}</div></section></div></main>;
}
