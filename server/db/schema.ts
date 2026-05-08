import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const mediaTypeEnum = pgEnum("media_type", ["image", "video"]);

export const appUsers = pgTable("app_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const mediaItems = pgTable("media_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerUserId: uuid("owner_user_id")
    .notNull()
    .references(() => appUsers.id, { onDelete: "restrict" }),
  bucketKey: text("bucket_key").notNull().unique(),
  mediaType: mediaTypeEnum("media_type").notNull(),
  title: text("title"),
  description: text("description"),
  capturedAt: timestamp("captured_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const mediaNotes = pgTable("media_notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  mediaItemId: uuid("media_item_id")
    .notNull()
    .references(() => mediaItems.id, { onDelete: "cascade" }),
  authorUserId: uuid("author_user_id")
    .notNull()
    .references(() => appUsers.id, { onDelete: "restrict" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const mediaCategories = pgTable(
  "media_categories",
  {
    mediaItemId: uuid("media_item_id")
      .notNull()
      .references(() => mediaItems.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.mediaItemId, table.categoryId] })],
);

export const loveNotes = pgTable("love_notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  authorUserId: uuid("author_user_id")
    .notNull()
    .references(() => appUsers.id, { onDelete: "restrict" }),
  body: text("body").notNull(),
  mediaItemId: uuid("media_item_id")
    .references(() => mediaItems.id, { onDelete: "set null" }),
  isRead: text("is_read").default("false").notNull(), // using text to avoid boolean migration issues
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const loveNotesRelations = relations(loveNotes, ({ one }) => ({
  author: one(appUsers, {
    fields: [loveNotes.authorUserId],
    references: [appUsers.id],
  }),
  mediaItem: one(mediaItems, {
    fields: [loveNotes.mediaItemId],
    references: [mediaItems.id],
  }),
}));

export const appUsersRelations = relations(appUsers, ({ many }) => ({
  mediaItems: many(mediaItems),
  mediaNotes: many(mediaNotes),
  loveNotes: many(loveNotes),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  mediaCategories: many(mediaCategories),
}));

export const mediaItemsRelations = relations(mediaItems, ({ one, many }) => ({
  owner: one(appUsers, {
    fields: [mediaItems.ownerUserId],
    references: [appUsers.id],
  }),
  notes: many(mediaNotes),
  mediaCategories: many(mediaCategories),
}));

export const mediaNotesRelations = relations(mediaNotes, ({ one }) => ({
  mediaItem: one(mediaItems, {
    fields: [mediaNotes.mediaItemId],
    references: [mediaItems.id],
  }),
  author: one(appUsers, {
    fields: [mediaNotes.authorUserId],
    references: [appUsers.id],
  }),
}));

export const mediaCategoriesRelations = relations(mediaCategories, ({ one }) => ({
  mediaItem: one(mediaItems, {
    fields: [mediaCategories.mediaItemId],
    references: [mediaItems.id],
  }),
  category: one(categories, {
    fields: [mediaCategories.categoryId],
    references: [categories.id],
  }),
}));
