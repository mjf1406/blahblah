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
      .query("encounters")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    difficulty: v.string(),
    partyLevel: v.number(),
    monsters: v.array(v.object({
      name: v.string(),
      quantity: v.number(),
      cr: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db.insert("encounters", {
      name: args.name,
      description: args.description,
      difficulty: args.difficulty,
      partyLevel: args.partyLevel,
      monsters: args.monsters,
      userId,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("encounters"),
    name: v.string(),
    description: v.string(),
    difficulty: v.string(),
    partyLevel: v.number(),
    monsters: v.array(v.object({
      name: v.string(),
      quantity: v.number(),
      cr: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const encounter = await ctx.db.get(args.id);
    if (!encounter) {
      throw new Error("Encounter not found");
    }

    if (encounter.userId !== userId) {
      throw new Error("Not authorized to edit this encounter");
    }

    return await ctx.db.patch(args.id, {
      name: args.name,
      description: args.description,
      difficulty: args.difficulty,
      partyLevel: args.partyLevel,
      monsters: args.monsters,
    });
  },
});

export const remove = mutation({
  args: {
    id: v.id("encounters"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const encounter = await ctx.db.get(args.id);
    if (!encounter) {
      throw new Error("Encounter not found");
    }

    if (encounter.userId !== userId) {
      throw new Error("Not authorized to delete this encounter");
    }

    return await ctx.db.delete(args.id);
  },
});
