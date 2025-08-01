import { alterScenesObjType, sceneType, typeEmotionsOptions } from "@/types";
import { relations } from "drizzle-orm";
import { boolean, index, integer, json, pgEnum, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core"
import type { AdapterAccountType } from "next-auth/adapters"
// type chT = typeof characters.$inferInsert

export const users = pgTable("users", {
    //defaults
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),

    //regular

    //null
    name: text("name"),
    email: text("email").unique(),
    emailVerified: timestamp("emailVerified", { mode: "date" }),
    image: text("image"),
})
export const userRelations = relations(users, ({ many }) => ({
    projects: many(projects),
}));




export const projects = pgTable("projects", {
    //defaults
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    dateCreated: timestamp("dateCreated", { mode: "date" }).notNull().defaultNow(),
    prompt: text("prompt").notNull().default(""),
    scenes: json("scenes").$type<sceneType[]>().notNull().default([]),
    alterScenesObj: json("alterScenesObj").$type<alterScenesObjType>().notNull().default({}),

    //regular
    name: text("name").notNull(),
    userId: text("userId").notNull().references(() => users.id),

    //null
},
    (t) => {
        return {
            projectNameIndex: index("projectNameIndex").on(t.name),
        };
    })
export const projectsRelations = relations(projects, ({ one }) => ({
    fromUser: one(users, {
        fields: [projects.userId],
        references: [users.id]
    }),
}));




export const characters = pgTable("characters", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    age: integer("age").notNull(),
    userId: text("userId").notNull().references(() => users.id),
})
export const charactersRelations = relations(characters, ({ one, many }) => ({
    charactersToEmotions: many(charactersToEmotions),
    fromUser: one(users, {
        fields: [characters.userId],
        references: [users.id]
    }),
}));




export const typeEmotionsEnum = pgEnum("typeEmotions", typeEmotionsOptions);

export const emotions = pgTable("emotions", {
    type: typeEmotionsEnum().primaryKey(),
})
export const emotionsRelations = relations(emotions, ({ many }) => ({
    charactersToEmotions: many(charactersToEmotions),
}));




export const charactersToEmotions = pgTable("charactersToEmotions", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),

    characterId: text("characterId").notNull().references(() => characters.id),
    emotionType: typeEmotionsEnum().notNull().references(() => emotions.type),
},
    (t) => {
        return {
            characterIdIndex: index("characterIdIndex").on(t.characterId),
        };
    })
export const charactersToEmotionsRelations = relations(charactersToEmotions, ({ one }) => ({
    character: one(characters, {
        fields: [charactersToEmotions.characterId],
        references: [characters.id],
    }),
    emotion: one(emotions, {
        fields: [charactersToEmotions.emotionType],
        references: [emotions.type],
    }),
}));

















































export const accounts = pgTable(
    "account",
    {
        userId: text("userId")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        type: text("type").$type<AdapterAccountType>().notNull(),
        provider: text("provider").notNull(),
        providerAccountId: text("providerAccountId").notNull(),
        refresh_token: text("refresh_token"),
        access_token: text("access_token"),
        expires_at: integer("expires_at"),
        token_type: text("token_type"),
        scope: text("scope"),
        id_token: text("id_token"),
        session_state: text("session_state"),
    },
    (account) => [
        {
            compoundKey: primaryKey({
                columns: [account.provider, account.providerAccountId],
            }),
        },
    ]
)
export const sessions = pgTable("session", {
    sessionToken: text("sessionToken").primaryKey(),
    userId: text("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date" }).notNull(),
})
export const verificationTokens = pgTable(
    "verificationToken",
    {
        identifier: text("identifier").notNull(),
        token: text("token").notNull(),
        expires: timestamp("expires", { mode: "date" }).notNull(),
    },
    (verificationToken) => [
        {
            compositePk: primaryKey({
                columns: [verificationToken.identifier, verificationToken.token],
            }),
        },
    ]
)
export const authenticators = pgTable(
    "authenticator",
    {
        credentialID: text("credentialID").notNull().unique(),
        userId: text("userId")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        providerAccountId: text("providerAccountId").notNull(),
        credentialPublicKey: text("credentialPublicKey").notNull(),
        counter: integer("counter").notNull(),
        credentialDeviceType: text("credentialDeviceType").notNull(),
        credentialBackedUp: boolean("credentialBackedUp").notNull(),
        transports: text("transports"),
    },
    (authenticator) => [
        {
            compositePK: primaryKey({
                columns: [authenticator.userId, authenticator.credentialID],
            }),
        },
    ]
)