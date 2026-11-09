import { afterEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { COOKIE_NAME } from "../shared/const";
import { digestToken, hashPassword, isSameOrigin, limitAuthAttempt, localSessionToken, normalizeEmail, requireSameOrigin, verifyPassword } from "./storeAuth";
import { localMutationOriginGuard } from "./storeAuthRoutes";

const req = (origin = "https://store.example", cookie = "") => ({
  method: "POST", headers: { cookie }, socket: { remoteAddress: "192.0.2.1" },
  get: (key: string) => key === "origin" ? origin : key === "host" ? "store.example" : undefined,
}) as unknown as Request;
afterEach(() => vi.unstubAllEnvs());
describe("autenticação própria da loja", () => {
  it("normaliza e-mail sem usá-lo como ID de usuário", () => { expect(normalizeEmail(" User@Example.Com ")).toBe("user@example.com"); });
  it("usa salt aleatório e verifica senha sem armazená-la em texto puro", async () => {
    const password = "Minha senha de teste com 18 caracteres";
    const first = await hashPassword(password); const second = await hashPassword(password);
    expect(first).not.toBe(second); expect(first).not.toContain(password);
    expect(await verifyPassword(password, first)).toBe(true);
    expect(await verifyPassword("senha incorreta", first)).toBe(false);
    expect(await verifyPassword(password, "malformed")).toBe(false);
  });
  it("identifica sessão própria sem confundi-la com OAuth legado", () => {
    expect(localSessionToken(req(undefined, `${COOKIE_NAME}=pb_abc`))).toBe("pb_abc");
    expect(localSessionToken(req(undefined, `${COOKIE_NAME}=legacy-jwt`))).toBeUndefined();
    expect(digestToken("pb_secret")).not.toContain("pb_secret");
  });
  it("recusa origens externas e ausentes nas operações de login", () => {
    expect(isSameOrigin(req())).toBe(true);
    expect(isSameOrigin(req("https://evil.example"))).toBe(false);
    expect(isSameOrigin(req(""))).toBe(false);
    expect(() => requireSameOrigin(req("https://evil.example"))).toThrow("Requisição de acesso inválida");
  });
  it("permite configurar apenas uma origem explícita de produção", () => {
    vi.stubEnv("PUBLIC_APP_URL", "https://public.example");
    expect(isSameOrigin(req("https://public.example"))).toBe(true);
    expect(isSameOrigin(req())).toBe(false);
  });
  it("protege mutações autenticadas contra CSRF sem bloquear OAuth existente", () => {
    const next = vi.fn(); const json = vi.fn(); const status = vi.fn(() => ({ json }));
    localMutationOriginGuard(req("https://evil.example", `${COOKIE_NAME}=pb_secret`), { status } as unknown as Response, next);
    expect(status).toHaveBeenCalledWith(403); expect(next).not.toHaveBeenCalled();
    localMutationOriginGuard(req("https://evil.example", `${COOKIE_NAME}=legacy`), { status } as unknown as Response, next);
    expect(next).toHaveBeenCalledOnce();
  });
  it("limita tentativas repetidas por conta", () => {
    const request = req(); const email = `rate-${Date.now()}@example.com`;
    for (let i = 0; i < 12; i++) limitAuthAttempt(request, email);
    expect(() => limitAuthAttempt(request, email)).toThrow("Muitas tentativas");
  });
});
