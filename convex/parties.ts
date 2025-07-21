import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }
    
    return await ctx.db
      .query("parties")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    levels: v.array(v.object({
      level: v.number(),
      quantity: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db.insert("parties", {
      name: args.name,
      levels: args.levels,
      userId,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("parties"),
    name: v.string(),
    levels: v.array(v.object({
      level: v.number(),
      quantity: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const party = await ctx.db.get(args.id);
    if (!party) {
      throw new Error("Party not found");
    }

    if (party.userId !== userId) {
      throw new Error("Not authorized to edit this party");
    }

    return await ctx.db.patch(args.id, {
      name: args.name,
      levels: args.levels,
    });
  },
});

export const remove = mutation({
  args: {
    id: v.id("parties"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const party = await ctx.db.get(args.id);
    if (!party) {
      throw new Error("Party not found");
    }

    if (party.userId !== userId) {
      throw new Error("Not authorized to delete this party");
    }

    return await ctx.db.delete(args.id);
  },
});
