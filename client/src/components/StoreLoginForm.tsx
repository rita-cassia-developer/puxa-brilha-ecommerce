import { useEffect, useState } from "react";

import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";

import { trpc } from "@/lib/trpc";



export function StoreLoginForm({ allowRegister = true, invitation = "" }: { allowRegister?: boolean; invitation?: string }) {
  
  const [mode, setMode] = useState<"login" | "register" | "activate">(invitation ? "activate" : "login");
  
  const [name, setName] = useState("");
  
  const [email, setEmail] = useState("");
  
  const [phone, setPhone] = useState("");
  
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
      
      const body = mode === "activate" ? { token: invitation, password } : mode === "register" ? { name, email, phone, password } : { email, password };
      
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
  
    {mode !== "activate" && allowRegister && <div className="store-auth-modes" aria-label="Tipo de acesso"><button type="button" aria-pressed={mode === "login"} onClick={() => changeMode("login")} disabled={pending}>Entrar</button>button><button type="button" aria-pressed={mode === "register"} onClick={() => changeMode("register")} disabled={pending}>Criar conta</button>button></div>div>}
  
    {mode === "activate" && <p className="store-auth-help">Ative o acesso que a loja liberou para você. O convite é individual e</div>






































