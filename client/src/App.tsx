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
import { StoreLoginForm } from "./components/StoreLoginForm";
import { LoaderCircle, LockKeyhole, ShieldCheck } from "lucide-react";

function AdminGate() {
  const auth = trpc.auth.me.useQuery();

  if (auth.isLoading) {
    return <div className="auth-gate"><LoaderCircle className="auth-spinner" size={26} /><p>Verificando seu acesso administrativo…</p></div>;
  }

  if (!auth.data) {
    return <div className="auth-gate"><div className="auth-gate-card"><div className="auth-gate-icon"><LockKeyhole size={22} /></div><span className="auth-gate-eyebrow">Puxa & Brilha</span><h1>Área administrativa</h1><p>Entre com o e-mail e a senha do seu acesso administrativo.</p><StoreLoginForm allowRegister={false} /><small>Somente cadastros autorizados pela loja podem administrar produtos, pedidos e parceiros.</small><a className="auth-gate-link" href="/">Voltar à loja e escolher outro acesso profissional</a></div></div>;
  }

  if (auth.data.role !== "admin") {
    return <div className="auth-gate"><div className="auth-gate-card"><div className="auth-gate-icon"><ShieldCheck size={22} /></div><span className="auth-gate-eyebrow">Acesso restrito</span><h1>Permissão necessária</h1><p>Esta conta está autenticada, mas ainda não possui permissão para administrar a Puxa & Brilha.</p><small>Peça à proprietária para liberar o perfil administrativo.</small></div></div>;
  }

  return <Admin />;
}

function Router() {
  return <Switch><Route path="/" component={Home} /><Route path="/admin" component={AdminGate} /><Route path="/vendedor" component={Vendor} /><Route path="/cliente" component={Customer} /><Route path="/legal/:page" component={Legal} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><a className="skip-link" href="#conteudo-principal">Pular para o conteúdo principal</a><div id="conteudo-principal" tabIndex={-1}><Toaster position="bottom-right" /><Router /></div></ThemeProvider></ErrorBoundary>;
}
