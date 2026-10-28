import { BriefcaseBusiness, LockKeyhole, ShieldCheck, Store, Users } from "lucide-react";
import { Link } from "wouter";
import { startLogin } from "@/const";

const profiles = [
  { key: "admin", title: "Administradora", description: "Produtos, pedidos, parceiros e configurações da loja.", icon: ShieldCheck, href: "/admin", loginLabel: "Entrar como administradora" },
  { key: "representative", title: "Representante", description: "Carteira de clientes, leads e comissões por venda.", icon: Users, href: "/vendedor", loginLabel: "Entrar como representante" },
  { key: "vendor", title: "Vendedor", description: "Indicações, vendas externas e acompanhamento de pedidos.", icon: BriefcaseBusiness, href: "/vendedor", loginLabel: "Entrar como vendedor" },
  { key: "distributor", title: "Distribuidor", description: "Pedidos em volume, distribuição e comissões configuráveis.", icon: Store, href: "/vendedor", loginLabel: "Entrar como distribuidor" },
] as const;

export default function ProfessionalAccess() {
  return <main className="professional-access-page"><header className="professional-access-header"><Link href="/" className="admin-breadcrumb">← Voltar à loja</Link><img className="brand-logo brand-logo-customer" src="/brand/puxa-e-brilha-logo.jpeg" alt="Puxa e Brilha" /><span className="test-badge"><LockKeyhole size={12} /> acesso restrito</span></header><section className="professional-access-content"><span className="eyebrow-small">Área profissional Puxa e Brilha</span><h1>Acesso para quem faz a operação acontecer.</h1><p>Esta área é exclusiva para a administradora e para parceiros cadastrados. Para comprar, volte à loja e use a opção de cliente.</p><div className="professional-profile-grid">{profiles.map(({ key, title, description, icon: Icon, href, loginLabel }) => <article className="professional-profile-card" key={key}><div className="professional-profile-icon"><Icon size={20} /></div><h2>{title}</h2><p>{description}</p><button className="button button-dark" onClick={() => { sessionStorage.setItem("puxa-brilha-login-profile", key); startLogin(href); }}>{loginLabel}</button>{key !== "admin" && <Link className="professional-demo-link" href={`/vendedor?demo=${key}`}>Ver demonstração</Link>}</article>)}</div><Link href="/" className="professional-back-store">← Continuar comprando como cliente</Link></section></main>;
}
