import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  parties: defineTable({
    name: v.string(),
    levels: v.array(v.object({
      level: v.number(),
      quantity: v.number(),
    })),
    userId: v.id("users"),
  }).index("by_user", ["userId"]),
  
  encounters: defineTable({
    name: v.string(),
    description: v.string(),
    difficulty: v.string(), // "Easy", "Medium", "Hard", "Deadly"
    partyLevel: v.number(),
    monsters: v.array(v.object({
      name: v.string(),
      quantity: v.number(),
      cr: v.string(), // Challenge Rating
    })),
    userId: v.id("users"),
  }).index("by_user", ["userId"]),
  
  worlds: defineTable({
    name: v.string(),
    description: v.string(),
    setting: v.string(), // "Fantasy", "Sci-Fi", "Modern", "Historical", etc.
    locations: v.array(v.object({
      name: v.string(),
      type: v.string(), // "City", "Dungeon", "Wilderness", etc.
      description: v.string(),
    })),
    userId: v.id("users"),
  }).index("by_user", ["userId"]),
  
  maps: defineTable({
    name: v.string(),
    description: v.string(),
    type: v.string(), // "Battle Map", "World Map", "Dungeon Map", etc.
    gridSize: v.optional(v.string()), // "5ft", "10ft", etc.
    dimensions: v.optional(v.object({
      width: v.number(),
      height: v.number(),
    })),
    worldId: v.optional(v.id("worlds")),
    userId: v.id("users"),
  }).index("by_user", ["userId"])
    .index("by_world", ["worldId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
