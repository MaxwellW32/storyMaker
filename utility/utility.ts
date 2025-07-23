import { textFileApiResponseSchema } from "@/types";

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

type fileTypeOption = "text" | "image"
export async function fetchMainFolderFile(filePath: string, option: fileTypeOption) {
    const response = await fetch(`/api/mainFolder/view?filePath=${filePath}`)
    if (option === "text") {
        const content = await response.json()
        const seenTextFileApiResponse = textFileApiResponseSchema.parse(content)

        return seenTextFileApiResponse.fileContent

    } else if (option === "image") {

    } else throw new Error("not an option")
}