import z from "zod"
import { characterType, textFileApiResponseSchema } from "@/types";
import { eq, gte, sql, SQLWrapper } from "drizzle-orm";
import { PgNumeric, PgInteger, PgTableWithColumns, PgEnumColumn } from 'drizzle-orm/pg-core'

export function deepClone<T>(object: T): T {
    return JSON.parse(JSON.stringify(object))
}

export function spaceCamelCase(seenString: string) {
    return seenString.replace(/([A-Z])/g, ' $1').replace(/^./, function (str) { return str.toUpperCase(); })
}

export function getPathname(fullUrl: string, base = "http://localhost") {
    try {
        return new URL(fullUrl, base).pathname;

    } catch (err) {
        console.error("Invalid URL:", fullUrl, err);
        return "";
    }
}

export function logJSON(name: string, obj: unknown) {
    console.log(`${name}`, JSON.stringify(obj, null, 2));
}

export function saveToLocalStorage(keyName: any, item: any) {
    localStorage.setItem(keyName, JSON.stringify(item));
}

export function retreiveFromLocalStorage(keyName: string): any {
    const initialkeyItem = localStorage.getItem(keyName);

    if (initialkeyItem === null) return null

    return JSON.parse(initialkeyItem);
}

export function removeFromLocalStorage(keyName: string): any {
    localStorage.removeItem(keyName);
}

export function formatLocalDateTime(seenDate: Date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };

    //@ts-expect-error type
    const customDateTime = seenDate.toLocaleString('en-US', options);
    return customDateTime
}

export function makeWhereClauses<T extends Object>(schema: z.Schema, filter: T, dbSchema: PgTableWithColumns<any>) {
    // Validate filter
    schema.parse(filter);

    const whereClauses: SQLWrapper[] = [];

    // Dynamically process filters
    for (const [keyPre, value] of Object.entries(filter)) {
        const key = keyPre as keyof T

        if (value === undefined || value === null) continue;

        // @ts-expect-error type
        const columnPre = dbSchema[key as keyof typeof dbSchema];
        if (!columnPre) continue;

        const column = columnPre as SQLWrapper

        if (typeof value === "string") {
            if (column instanceof PgNumeric || column instanceof PgInteger || column instanceof PgEnumColumn) {
                whereClauses.push(eq(column, value));

            } else {
                whereClauses.push(sql`LOWER(${column}) LIKE LOWER(${`%${value}%`})`);
            }

        } else if (typeof value === "number") {
            whereClauses.push(eq(column, value));

        } else if (typeof value === "boolean") {
            whereClauses.push(eq(column, value));

        } else if (value instanceof Date) {
            // Match only date
            whereClauses.push(gte(
                column,
                new Date(value)
            ));

        } else if (Array.isArray(value)) {
            //check if array has items
            whereClauses.push(sql`${column}::text != '[]'`);

        } else {
            // fallback or skip unknown types
            continue;
        }
    }

    return whereClauses
}

export function convertBtyes(bytes: number, option: "kb" | "mb" | "gb") {
    if (option === "kb") {
        return bytes / 1024
    } else if (option === "mb") {
        return (bytes / 1024) / 1024
    } else {
        return ((bytes / 1024) / 1024) / 1024
    }
}

export function replaceSlashComments(originalText: string, slashComment: string, additionalText?: string) {
    const lines = originalText.split("\n")

    let foundAtLineIndex: number | null = null
    let keepLine = true

    let linesWithoutSlashComments = lines.filter((eachLine, eachLineIndex) => {
        //as long as doesnt have the searched slash comment can keep
        const hasSlashComment = eachLine.includes(slashComment)

        //stop keeping lines once slash comment read
        if (hasSlashComment) {
            keepLine = !keepLine

            //set the original line it was found at
            if (foundAtLineIndex === null) {
                foundAtLineIndex = eachLineIndex
            }
        }

        console.log(`$line: "${eachLine}" keepLine: `, keepLine);

        return keepLine
    })

    //add in text if wanted
    if (additionalText !== undefined && foundAtLineIndex !== null) {
        linesWithoutSlashComments = [
            ...linesWithoutSlashComments.slice(0, foundAtLineIndex),
            additionalText,
            ...linesWithoutSlashComments.slice(foundAtLineIndex + 1),//ensure we skip last slash Comment that was included
        ]
    }

    return linesWithoutSlashComments.join("\n")
}