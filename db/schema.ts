import { activeCharacterClothingType, alterDialogueObjType, alterScenesObjType, clothingType, sceneType } from "@/types";
import { relations } from "drizzle-orm";
import { boolean, index, integer, json, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core"
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
    alterDialogueObj: json("alterDialogueObj").$type<alterDialogueObjType>().notNull().default({}),
    activeCharacterClothingStarter: json("activeCharacterClothingStarter").$type<activeCharacterClothingType>().notNull().default({}),

    //regular
    name: text("name").notNull(),
    userId: text("userId").notNull().references(() => users.id),
    baseInstructions: text("baseInstructions").notNull(),

    //null
},
    (t) => {
        return {
            projectNameIndex: index("projectNameIndex").on(t.name),
        };
    })
export const projectsRelations = relations(projects, ({ one, many }) => ({
    charactersToProjects: many(charactersToProjects),
    fromUser: one(users, {
        fields: [projects.userId],
        references: [users.id]
    }),
}));




export const characters = pgTable("characters", {
    //default
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),

    //regular
    name: text("name").notNull(),
    age: integer("age").notNull(),
    userId: text("userId").notNull().references(() => users.id),
    voiceId: text("voiceId").notNull(),
    personality: text("personality").notNull(), // e.g. "brooding and analytical", "cheerful and impulsive"
    appearance: text("appearance").notNull(), // Highly detailed on their physical appearance to ensure consistency accross image generation, leave out clothing detail.
    //appearance
    clothing: json("clothing").$type<clothingType[]>().notNull(),
    //behaviour
    toneOfVoice: text("toneOfVoice").notNull(), // e.g. "sarcastic", "soft-spoken", "authoritative"
    dialogueStyle: text("dialogueStyle").notNull(), // e.g. "uses short, clipped sentences", "speaks in metaphors"
    alignment: text("alignment").notNull(), // e.g. "Lawful Good", "Chaotic Neutral", or your own moral scale
    goal: text("goal").notNull(), // What drives the character
    fear: text("fear").notNull(), // What the character is afraid of
    fatalFlaw: text("fatalFlaw").notNull(), // e.g. "trusts too easily", "overconfident"
    backstory: text("backstory").notNull(), // Important past experiences
    occupation: text("occupation").notNull(), // Their role in the story or world
    location: text("location").notNull(), // Where they're usually found
    archetype: text("archetype").notNull(), // e.g. "The Hero", "The Trickster", "The Mentor"
})
export const charactersRelations = relations(characters, ({ one, many }) => ({
    charactersToProjects: many(charactersToProjects),
    charactersToEmotions: many(charactersToEmotions),
    charactersToTags: many(charactersToTags),
    fromUser: one(users, {
        fields: [characters.userId],
        references: [users.id]
    }),
}));




export const emotions = pgTable("emotions", {
    type: text("type").primaryKey(),
})
export const emotionsRelations = relations(emotions, ({ many }) => ({
    charactersToEmotions: many(charactersToEmotions),
}));




export const tags = pgTable("tags", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull().unique(),
})
export const tagsRelations = relations(tags, ({ many }) => ({
    charactersToTags: many(charactersToTags),
}));




export const charactersToEmotions = pgTable("charactersToEmotions", {
    simpleId: text("simpleId").notNull().$defaultFn(() => crypto.randomUUID()),

    characterId: text("characterId").notNull().references(() => characters.id),
    emotionType: text("emotionType").notNull().references(() => emotions.type),
},
    (t) => {
        return {
            pk: primaryKey({ columns: [t.characterId, t.emotionType] }),
            charactersToEmotionsCharacterIdIndex: index("charactersToEmotionsCharacterIdIndex").on(t.characterId),
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




export const charactersToProjects = pgTable("charactersToProjects", {
    simpleId: text("simpleId").notNull().$defaultFn(() => crypto.randomUUID()),

    characterId: text("characterId").notNull().references(() => characters.id),
    projectId: text("projectId").notNull().references(() => projects.id),
},
    (t) => {
        return {
            pk: primaryKey({ columns: [t.characterId, t.projectId] }),
            charactersToProjectsProjectIdIndex: index("charactersToProjectsProjectIdIndex").on(t.projectId),
        };
    })
export const charactersToProjectsRelations = relations(charactersToProjects, ({ one }) => ({
    character: one(characters, {
        fields: [charactersToProjects.characterId],
        references: [characters.id],
    }),
    project: one(projects, {
        fields: [charactersToProjects.projectId],
        references: [projects.id],
    }),
}));




export const charactersToTags = pgTable("charactersToTags", {
    simpleId: text("simpleId").notNull().$defaultFn(() => crypto.randomUUID()),

    characterId: text("characterId").notNull().references(() => characters.id),
    tagId: text("tagId").notNull().references(() => tags.id),
},
    (t) => {
        return {
            pk: primaryKey({ columns: [t.characterId, t.tagId] }),
            charactersToTagsCharacterIdIndex: index("charactersToTagsCharacterIdIndex").on(t.characterId),
        };
    })
export const charactersToTagsRelations = relations(charactersToTags, ({ one }) => ({
    character: one(characters, {
        fields: [charactersToTags.characterId],
        references: [characters.id],
    }),
    tag: one(tags, {
        fields: [charactersToTags.tagId],
        references: [tags.id],
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