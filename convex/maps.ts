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
      .query("maps")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const listByWorld = query({
  args: {
    worldId: v.id("worlds"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }
    
    return await ctx.db
      .query("maps")
      .withIndex("by_world", (q) => q.eq("worldId", args.worldId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    type: v.string(),
    gridSize: v.optional(v.string()),
    dimensions: v.optional(v.object({
      width: v.number(),
      height: v.number(),
    })),
    worldId: v.optional(v.id("worlds")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db.insert("maps", {
      name: args.name,
      description: args.description,
      type: args.type,
      gridSize: args.gridSize,
      dimensions: args.dimensions,
      worldId: args.worldId,
      userId,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("maps"),
    name: v.string(),
    description: v.string(),
    type: v.string(),
    gridSize: v.optional(v.string()),
    dimensions: v.optional(v.object({
      width: v.number(),
      height: v.number(),
    })),
    worldId: v.optional(v.id("worlds")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const map = await ctx.db.get(args.id);
    if (!map) {
      throw new Error("Map not found");
    }

    if (map.userId !== userId) {
      throw new Error("Not authorized to edit this map");
    }

    return await ctx.db.patch(args.id, {
      name: args.name,
      description: args.description,
      type: args.type,
      gridSize: args.gridSize,
      dimensions: args.dimensions,
      worldId: args.worldId,
    });
  },
});

export const remove = mutation({
  args: {
    id: v.id("maps"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const map = await ctx.db.get(args.id);
    if (!map) {
      throw new Error("Map not found");
    }

    if (map.userId !== userId) {
      throw new Error("Not authorized to delete this map");
    }

    return await ctx.db.delete(args.id);
  },
});
