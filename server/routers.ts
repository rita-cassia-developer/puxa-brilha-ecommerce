import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { createOrder, createProduct, deleteProduct, listOrders, listProducts, registerReferralVisit, updateOrderStatus, updateProduct } from "./db";
import { z } from "zod";

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
  imageUrl: z.string().url().max(500).optional().nullable(),
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
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  admin: router({
    session: adminProcedure.query(({ ctx }) => ({
      id: ctx.user.id,
      name: ctx.user.name,
      email: ctx.user.email,
      role: ctx.user.role,
    })),
  }),

  products: router({
    list: adminProcedure.input(z.object({ search: z.string().optional() }).optional()).query(({ input }) => listProducts(input?.search)),
    create: adminProcedure.input(productInput).mutation(({ input }) => createProduct({
      ...input,
      slug: `${slugify(input.name)}-${Date.now()}`,
      price: input.price.toFixed(2),
      oldPrice: input.oldPrice == null ? null : input.oldPrice.toFixed(2),
      stock: input.stock,
      weightGrams: input.weightGrams,
    })),
    update: adminProcedure.input(productInput.extend({ id: z.number().int().positive() })).mutation(({ input }) => {
      const { id, ...values } = input;
      return updateProduct(id, {
        ...values,
        price: values.price.toFixed(2),
        oldPrice: values.oldPrice == null ? null : values.oldPrice.toFixed(2),
      });
    }),
    remove: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => deleteProduct(input.id)),
  }),

  catalog: router({
    list: publicProcedure.query(() => listProducts(undefined, true)),
  }),

  orders: router({
    create: publicProcedure.input(z.object({
      items: z.array(z.object({ productId: z.coerce.number().int().positive(), quantity: z.coerce.number().int().positive() })).min(1),
      customerName: z.string().trim().min(2).max(160),
      customerEmail: z.string().email().max(320).optional(),
      customerPhone: z.string().max(40).optional(),
      address: z.record(z.string(), z.string()).optional(),
      cep: z.string().optional(),
      paymentMethod: z.enum(["pix", "card", "boleto", "link"]),
      fulfillment: z.enum(["delivery", "pickup"]),
      referralCode: z.string().trim().max(32).optional(),
    })).mutation(({ input }) => createOrder(input)),
    list: adminProcedure.query(() => listOrders()),
    updateStatus: adminProcedure.input(z.object({
      id: z.number().int().positive(),
      paymentStatus: z.enum(["pending", "approved", "rejected", "refunded"]).optional(),
      orderStatus: z.enum(["pending", "paid", "processing", "shipped", "ready_pickup", "completed", "cancelled"]).optional(),
    })).mutation(({ input }) => {
      const { id, ...values } = input;
      return updateOrderStatus(id, values);
    }),
  }),

  referrals: router({
    visit: publicProcedure.input(z.object({
      code: z.string().trim().min(3).max(32),
      sessionId: z.string().trim().min(8).max(128),
      productId: z.coerce.number().int().positive().optional(),
      landingPath: z.string().max(500).optional(),
      userAgent: z.string().max(500).optional(),
    })).mutation(({ input }) => registerReferralVisit(input)),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
