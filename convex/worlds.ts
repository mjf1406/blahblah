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
      .query("worlds")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    setting: v.string(),
    locations: v.array(v.object({
      name: v.string(),
      type: v.string(),
      description: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db.insert("worlds", {
      name: args.name,
      description: args.description,
      setting: args.setting,
      locations: args.locations,
      userId,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("worlds"),
    name: v.string(),
    description: v.string(),
    setting: v.string(),
    locations: v.array(v.object({
      name: v.string(),
      type: v.string(),
      description: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const world = await ctx.db.get(args.id);
    if (!world) {
      throw new Error("World not found");
    }

    if (world.userId !== userId) {
      throw new Error("Not authorized to edit this world");
    }

    return await ctx.db.patch(args.id, {
      name: args.name,
      description: args.description,
      setting: args.setting,
      locations: args.locations,
    });
  },
});

export const remove = mutation({
  args: {
    id: v.id("worlds"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const world = await ctx.db.get(args.id);
    if (!world) {
      throw new Error("World not found");
    }

    if (world.userId !== userId) {
      throw new Error("Not authorized to delete this world");
    }

    return await ctx.db.delete(args.id);
  },
});
