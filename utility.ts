export function getPathname(fullUrl: string, base = "http://localhost") {
    try {
        return new URL(fullUrl, base).pathname;

    } catch (err) {
        console.error("Invalid URL:", fullUrl, err);
        return "";
    }
}