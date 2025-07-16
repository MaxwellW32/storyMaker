import { z } from "zod";

export const dateSchma = z.preprocess((val) => {
    if (typeof val === "string" || typeof val === "number") return new Date(val);
    return val;
}, z.date())




export const characterSchema = z.object({
    //defaults
    id: z.string().min(1),
    //null
    name: z.string().min(1).nullable(),
})
export type characterType = z.infer<typeof characterSchema> & {
}