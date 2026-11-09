import { useEffect, useState } from "react";
import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

export function StoreLoginForm({ allowRegister = true, invitation = "" }: { allowRegister?: boolean; invitation?: string }) {
  const [mode, setMode] = useState<"login" | "register" | "activate">(invitation ? "activate" : "login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState<boolean | null>(null);
  const utils = trpc.useUtils();
  useEffect(() => {
    let active = true;
    fetch("/api/store-auth/status", { credentials: "same-origin", cache: "no-store" })
      .then(response => response.json()).then(result => { if (active) setReady(Boolean(result.ready)); })
      .catch(() => { if (active) setReady(false); });
    return () => { active = false; };
  }, []);
  const changeMode = (next: "login" | "register") => { setMode(next); setError(""); setPassword(""); setConfirmation(""); };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending) return;
    setError("");
    if (mode !== "login" && password !== confirmation) { setError("As senhas não coincidem."); return; }
    setPending(true);
    try {
      const body = mode === "activate" ? { token: invitation, password } : mode === "register" ? { name, email, password } : { email, password };
      const response = await fetch(`/api/store-auth/${mode}`, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível acessar a conta. Tente novamente.");
      setPassword(""); setConfirmation("");
      const user = await utils.auth.me.fetch();
      if (!user) throw new Error("O navegador não manteve a sessão. Abra a loja em uma aba própria e permita os cookies para entrar.");
      const allowed = ["/cliente", "/admin", "/vendedor"];
      window.location.assign(allowed.includes(result.destination) ? result.destination : "/cliente");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível acessar a conta."); }
    finally { setPending(false); }
  };
  return <div className="store-login-form-wrap">
    {mode !== "activate" && allowRegister && <div className="store-auth-modes" aria-label="Tipo de acesso"><button type="button" aria-pressed={mode === "login"} onClick={() => changeMode("login")} disabled={pending}>Entrar</button><button type="button" aria-pressed={mode === "register"} onClick={() => changeMode("register")} disabled={pending}>Criar conta</button></div>}
    {mode === "activate" && <p className="store-auth-help">Ative o acesso que a loja liberou para você. O convite é individual e não altera seu perfil ou ID de indicação.</p>}
    {ready === false && <p role="status" className="store-auth-notice">O formulário está disponível, mas a hospedagem ainda precisa habilitar as tabelas de login. Você pode continuar comprando sem login.</p>}
    <form className="store-login-form" onSubmit={submit} aria-busy={pending}>
      {mode === "register" && <label htmlFor="store-auth-name">Nome completo<input id="store-auth-name" name="name" autoComplete="name" required minLength={2} maxLength={160} value={name} onChange={event => setName(event.target.value)} disabled={pending} /></label>}
      {mode !== "activate" && <label htmlFor="store-auth-email">E-mail<input id="store-auth-email" name="email" type="email" autoComplete="username" required maxLength={320} value={email} onChange={event => setEmail(event.target.value)} disabled={pending} /></label>}
      <label htmlFor="store-auth-password">{mode === "login" ? "Senha" : "Crie sua senha"}<span className="store-password-field"><input id="store-auth-password" name="password" type={visible ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={mode === "login" ? 1 : 10} maxLength={128} value={password} onChange={event => setPassword(event.target.value)} aria-describedby={mode !== "login" ? "store-password-help" : undefined} disabled={pending} /><button type="button" onClick={() => setVisible(value => !value)} aria-label={visible ? "Ocultar senha" : "Mostrar senha"} aria-pressed={visible} disabled={pending}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></label>
      {mode !== "login" && <><small id="store-password-help" className="store-auth-help">Use pelo menos 10 caracteres. Não reutilize a senha de outro serviço.</small><label htmlFor="store-auth-confirm">Confirme sua senha<input id="store-auth-confirm" name="confirmation" type={visible ? "text" : "password"} autoComplete="new-password" required minLength={10} maxLength={128} value={confirmation} onChange={event => setConfirmation(event.target.value)} disabled={pending} /></label></>}
      {error && <p className="store-auth-error" role="alert">{error}</p>}
      <button className="button button-dark store-auth-submit" type="submit" disabled={pending || ready === false}>{pending ? <><LoaderCircle className="auth-spinner" size={18} /> Verificando…</> : <>{mode === "register" ? "Criar minha conta" : mode === "activate" ? "Ativar meu acesso" : "Entrar na minha conta"}<ArrowRight size={16} /></>}</button>
      {mode === "login" && <p className="store-auth-help">Se o seu acesso ainda não tem senha ou você precisa recuperá-lo, <a href="https://wa.me/5534984241133?text=Preciso%20de%20ajuda%20com%20meu%20acesso%20na%20Puxa%20%26%20Brilha" target="_blank" rel="noreferrer">fale com a equipe da loja</a>. Não envie sua senha.</p>}
    </form>
  </div>;
}

export function StoreLogoutButton() {
  const [error, setError] = useState("");
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => {
      try { sessionStorage.removeItem("manus-cookie"); } catch { /* Storage may be blocked. */ }
      window.location.assign("/");
    },
    onError: () => setError("Não foi possível sair agora. Tente novamente."),
  });
  return <span className="store-logout-control"><button type="button" className="button button-quiet" disabled={logout.isPending} onClick={() => { setError(""); logout.mutate(); }}>{logout.isPending ? "Saindo…" : "Sair da conta"}</button>{error && <small role="alert">{error}</small>}</span>;
}
