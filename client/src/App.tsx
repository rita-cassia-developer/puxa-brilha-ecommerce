import { Toaster } from "@/components/ui/sonner";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Admin from "./pages/Admin";
import Home from "./pages/Home";
import Vendor from "./pages/Vendor";
import Customer from "./pages/Customer";
import Legal from "./pages/Legal";
import { trpc } from "./lib/trpc";
import { startLogin } from "./const";
import { LoaderCircle, LockKeyhole, ShieldCheck } from "lucide-react";

function AdminGate() {
  const auth = trpc.auth.me.useQuery();

  if (auth.isLoading) {
    return <div className="auth-gate"><LoaderCircle className="auth-spinner" size={26} /><p>Verificando seu acesso administrativo…</p></div>;
  }

  if (!auth.data) {
    return <div className="auth-gate"><div className="auth-gate-card"><div className="auth-gate-icon"><LockKeyhole size={22} /></div><span className="auth-gate-eyebrow">Puxa e Brilha</span><h1>Área administrativa</h1><p>Entre com sua conta Manus para acessar o catálogo, produtos e configurações da loja.</p><button className="auth-gate-button" onClick={() => startLogin()}>Entrar como administradora</button><small>O acesso é protegido e a loja pública continua disponível para os clientes.</small><a className="auth-gate-link" href="/cliente">Escolher outro perfil</a></div></div>;
  }

  if (auth.data.role !== "admin" && auth.data.role !== "manager") {
    return <div className="auth-gate"><div className="auth-gate-card"><div className="auth-gate-icon"><ShieldCheck size={22} /></div><span className="auth-gate-eyebrow">Acesso restrito</span><h1>Permissão necessária</h1><p>Esta conta está autenticada, mas ainda não possui permissão para administrar a Puxa e Brilha.</p><small>Peça à proprietária para liberar o perfil administrativo.</small></div></div>;
  }

  return <Admin />;
}

function Router() {
  return <Switch><Route path="/" component={Home} /><Route path="/admin" component={AdminGate} /><Route path="/vendedor" component={Vendor} /><Route path="/cliente" component={Customer} /><Route path="/legal/:page" component={Legal} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><Toaster position="bottom-right" /><Router /></ThemeProvider></ErrorBoundary>;
}
