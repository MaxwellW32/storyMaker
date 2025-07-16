import { relations } from "drizzle-orm";
import { pgTable, text } from "drizzle-orm/pg-core"

export const characters = pgTable("characters", {
    //defaults
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    //null
    name: text("name"),
})
export const userRelations = relations(characters, ({ }) => ({
}));