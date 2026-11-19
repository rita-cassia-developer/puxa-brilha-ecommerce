import { COOKIE_NAME } from "@shared/const";

import { getSessionCookieOptions } from "./_core/cookies";

import { systemRouter } from "./_core/systemRouter";

import { adminProcedure, customerProcedure, publicProcedure, router, vendorProcedure } from "./_core/trpc";

import { createManualVendor, createOrder, createProduct, deleteOrder, deleteProduct, ensureOwnReferralLink, ensureReferralLink, getOrderDetail, getVendorDashboard, listCommissions, listCustomerOrders, listLeads, listOrders, saveOrderCheckout, listProducts, listVendors, registerReferralVisit, updateOrderStatus, updateProduct } from "./db";

import { z } from "zod";

import { TRPCError } from "@trpc/server";

import { createPartnerInvitation, revokeLocalSession, StoreAuthError } from "./storeAuth";

import { createMercadoPagoOrder, createMercadoPagoPixOrder, getMercadoPagoPixPayment } from "./mercadoPago";



const productInput = z.object({
  
  name: z.string().trim().min(1).max(180),
  
  category: z.string().trim().min(1).max(80),
  
  description: z.string().trim().min(1),
  
  price: z.coerce.number().min(0),
  
  oldPrice: z.coerce.number().min(0).optional().nullable(),
  
  badge: z.string().trim().max(80).optional().nullable(),
  
  accent: z.enum(["olive", "clay", "sand", "rose", "ink"]).default("rose"),
  
  note: z.string().trim().max(160).optional().nullable(),
  
  stock: z.coerce.number().int().min(0),
  
  weightGrams: z.coerce.number().int().min(0),
  
  imageUrl: z.string().trim().max(500).refine(value => {
    
    if (value.startsWith("/brand/")) {
      
      return /^\/brand\/(?:[A-Za-z0-9_-][A-Za-z0-9._-]*\/)*[A-Za-z0-9_-][A-Za-z0-9._-]*$/.test(value);
      
    }
    
    try {
      
      const url = new URL(value);
      
      return url.protocol === "https:" && !url.username && !url.password;
      
    } catch {
      
      return false;
      
    }
    
  }, { message: "Use uma URL HTTPS ou um caminho local válido iniciado por /brand/." }).optional().nullable(),
  
  status: z.enum(["draft", "active", "archived"]).default("active"),
  
});



function slugify(value: string) {
  
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  
}



export const appRouter = router({
  
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  
  system: systemRouter,
  
  auth: router({
    
    me: publicProcedure.query(opts => opts.ctx.user),
    
    logout: publicProcedure.mutation(async ({ ctx }) => {
      
      let revoked = true;
      
      try { await revokeLocalSession(ctx.req); } catch { revoked = false; }
      
      const cookieOptions = getSessionCookieOptions(ctx.req);
      
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      
      if (!revoked) return { success: true, warning: "A sessão foi encerrada neste navegador, mas a revogação no servidor precisa ser verificada quando o banco voltar." } as const;
      
      return { success: true } as const;
      
    }),
    
  }),
  
  admin: router({
    
    session: adminProcedure.query(({ ctx }) => ({ id: ctx.user.id, name: ctx.user.name, email: ctx.user.email, role: ctx.user.role })),
    
  }),
  
  products: router({
    
    list: adminProcedure.input(z.object({ search: z.string().optional() }).optional()).query(({ input }) => listProducts(input?.search)),
    
    create: adminProcedure.input(productInput).mutation(({ input }) => createProduct({ ...input, slug: `${slugify











































