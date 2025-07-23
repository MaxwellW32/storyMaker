import { alterScenesObjType, sceneType, typeEmotionsOptions } from "@/types";
import { relations } from "drizzle-orm";
import { index, integer, json, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core"
// type chT = typeof characters.$inferInsert

export const projects = pgTable("projects", {
    //defaults
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    dateCreated: timestamp("dateCreated", { mode: "date" }).notNull().defaultNow(),
    prompt: text("prompt").notNull().default("what story should we generate?"),
    scenes: json("scenes").$type<sceneType[]>().notNull().default([]),
    alterScenesObj: json("alterScenesObj").$type<alterScenesObjType>().notNull().default({}),

    //regular
    name: text("name").notNull(),

    //null
},
    (t) => {
        return {
            projectNameIndex: index("projectNameIndex").on(t.name),
        };
    })
export const projectsRelations = relations(projects, ({ }) => ({
}));




export const characters = pgTable("characters", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    age: integer("age").notNull(),

})
export const charactersRelations = relations(characters, ({ many }) => ({
    charactersToEmotions: many(charactersToEmotions),
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