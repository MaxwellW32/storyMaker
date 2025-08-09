import JSZip from "jszip";
import path from "path";
import fs from "fs/promises";
import { checkIfDirectoryExists, ensureDirectoryExists } from "@/utility/manageFiles";
import { NextResponse } from "next/server";
import { downloadProjectBodySchema } from "@/types";
import { getSpecificProject } from "@/serverFunctions/handleProjects";
import { projectStagingAreaDir } from "@/lib/dirPaths";

export async function POST(request: Request) {
    //parse body
    const seenDownloadProjectBody = downloadProjectBodySchema.parse(await request.json())

    //fetch website
    const seenProject = await getSpecificProject(seenDownloadProjectBody.projectId)
    if (seenProject === undefined) throw new Error("not seeing project")

    //auth check

    const baseFolderPath = path.join(process.cwd(), projectStagingAreaDir, seenProject.id)

    //if baseFolder already exists delete it
    if (await checkIfDirectoryExists(baseFolderPath)) {
        await fs.rm(baseFolderPath, { force: true, recursive: true })
    }
    //make baseFolder
    await ensureDirectoryExists(baseFolderPath)

    //make characters folder
    //create the app folder
    const appFolderPath = path.join(baseFolderPath, "app")
    await ensureDirectoryExists(appFolderPath)

    //make mainProject folder

    //make js for after effects


    //copy the starter to my base path
    // await fs.cp(websiteBuildsStarterFolderPath, baseFolderPath, { recursive: true })




    //make fav icon



    //ensure website usedComponents seen
    if (seenProject.usedComponents === undefined) throw new Error("not seeing usedComponents")




    //make global.css
    const globalsCssFilePath = path.join(appFolderPath, "globals.css")

    //start off global css string
    let combinedPageCssString = `@import "tailwindcss";\n\n${seenProject.globalCss}`

    //write the css for all usedComponents
    combinedPageCssString += seenProject.usedComponents.map(eachUsedComponent => {
        const scopedUsedComponentCss = addScopeToCSS(eachUsedComponent.css, eachUsedComponent.id)

        return `\n\n\n\n\n${scopedUsedComponentCss}\n\n\n\n\n`
    }).join("")

    //write the global.css file
    await fs.writeFile(globalsCssFilePath, combinedPageCssString);




    //make layout.tsx
    const layoutFilePath = path.join(appFolderPath, "layout.tsx")

    //get base usedComponents in location header and footer
    const headerUsedComponents = getUsedComponentsInSameLocation({ type: "header" }, seenProject.usedComponents)
    const footerUsedComponents = getUsedComponentsInSameLocation({ type: "footer" }, seenProject.usedComponents)

    //order the components
    const headerUsedComponentsOrdered = sortUsedComponentsByOrder(headerUsedComponents)
    const footerUsedComponentsOrdered = sortUsedComponentsByOrder(footerUsedComponents)

    //then get all their descendants for proper import
    const headerAndFooterUsedComponents: usedComponent[] = [...headerUsedComponentsOrdered, ...footerUsedComponentsOrdered]
    const allDescendedUsedComponents: usedComponent[] = getDescendedUsedComponents(headerAndFooterUsedComponents.map(e => e.id), seenProject.usedComponents)
    const allUsedComponentsUsed: usedComponent[] = [...headerAndFooterUsedComponents, ...allDescendedUsedComponents]

    //get all the needed import statements
    const usedComponentsImportsText = getUsedComponentsImportString(allUsedComponentsUsed)

    //get usedComponents in this location
    const headerUsedComponentsText = makeUsedComponentsImplementationString(headerUsedComponentsOrdered, seenProject.usedComponents)
    const footerUsedComponentsText = makeUsedComponentsImplementationString(footerUsedComponentsOrdered, seenProject.usedComponents)

    //get global fonts
    const seenFontImportStrings = getFontImportStrings(seenProject.fonts)

    const layoutTsxFileString =
        `${seenFontImportStrings.fontImportStr}
import "./globals.css";
import type { Metadata } from "next";
${usedComponentsImportsText}

${seenFontImportStrings.variableImplementationStr}

export const metadata: Metadata = {
  title: "${seenProject.title}",
  description: "${seenProject.description}",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={\`${seenFontImportStrings.classNameImplementationStr} antialiased\`}
      >
        ${headerUsedComponentsText}

        {children}

        ${footerUsedComponentsText}
      </body>
    </html>
  );
}
`
    await fs.writeFile(layoutFilePath, layoutTsxFileString);




    //make pages
    if (seenProject.pages === undefined) throw new Error("not seeing pages")

    await Promise.all(
        seenProject.pages.map(async eachPage => {
            if (seenProject.usedComponents === undefined) return

            //ensure page link is possible
            const validatedPageLinkName = makeValidPageLinkName(eachPage.link)

            //create the page folder
            const onHomePage = eachPage.link === "/"

            //where to write new page
            const pageFolderPath = onHomePage ? path.join(appFolderPath) : path.join(appFolderPath, validatedPageLinkName)

            //make the page folder in the app directory
            await ensureDirectoryExists(pageFolderPath)

            //get base usedComponents on the page
            const usedComponentsOnPage = getUsedComponentsInSameLocation({ type: "page", pageId: eachPage.id }, seenProject.usedComponents)

            //order the components
            const usedComponentsOnPageOrdered = sortUsedComponentsByOrder(usedComponentsOnPage)

            //then get all their descendants for proper import
            const allDescendedUsedComponents: usedComponent[] = getDescendedUsedComponents(usedComponentsOnPageOrdered.map(e => e.id), seenProject.usedComponents)
            const allUsedComponentsUsed: usedComponent[] = [...usedComponentsOnPageOrdered, ...allDescendedUsedComponents]

            //get all the needed import statements
            const usedComponentsImportsText = getUsedComponentsImportString(allUsedComponentsUsed)

            //get usedComponents in this location
            const pageUsedComponentsText = makeUsedComponentsImplementationString(usedComponentsOnPageOrdered, seenProject.usedComponents)

            //whats in the page.tsx file
            const pageTsxFileString = `${usedComponentsImportsText}

export default function ${onHomePage ? "Home" : "Page"}() {
  return (
    <>
        ${pageUsedComponentsText}
    </>
  );
}
`

            //page.tsx file path
            const pageFilePath = path.join(pageFolderPath, "page.tsx")

            //write to the actual file
            await fs.writeFile(pageFilePath, pageTsxFileString);
        })
    )




    //create the components folder
    const componentsFolderPath = path.join(baseFolderPath, "components")
    await ensureDirectoryExists(componentsFolderPath)

    //hold all template ids for file copying
    const allTemplateIdsToCopy: string[] = []
    seenProject.usedComponents.map(eachUsedComponent => {
        if (!allTemplateIdsToCopy.includes(eachUsedComponent.templateId)) {
            allTemplateIdsToCopy.push(eachUsedComponent.templateId)
        }
    })

    //all templates lcoation on main website
    const websiteTemplatesFolderPath = path.join(process.cwd(), websiteTemplatesDir)

    //copy all the used template's component files to the components folder
    await Promise.all(allTemplateIdsToCopy.map(async eachTemplateId => {
        //where copying from
        const websiteTemplateIndividualFolderPath = path.join(websiteTemplatesFolderPath, eachTemplateId)

        //where to copy to
        const individualComponentsFolderPath = path.join(componentsFolderPath, eachTemplateId)

        //copy from the websiteTemplatesDir to the local components directory
        await fs.cp(websiteTemplateIndividualFolderPath, individualComponentsFolderPath, { recursive: true })
    }))

    //create the public folder
    const publicFolderPath = path.join(baseFolderPath, "public")
    await ensureDirectoryExists(publicFolderPath)




    //build types file



    if (seenDownloadProjectBody.downloadOption === "zip") {
        //zip the folder
        const zip = new JSZip();
        // Function to recursively add files and directories to the zip object
        const addFolderToZip = async (folderPath: string, relativePath: string) => {
            const files = await fs.readdir(folderPath);

            for (const file of files) {
                const filePath = path.join(folderPath, file);
                const relativeFilePath = path.join(relativePath, file);
                const stats = await fs.stat(filePath);

                if (stats.isDirectory()) {
                    await addFolderToZip(filePath, relativeFilePath); // Recursively add subdirectories

                } else {
                    const fileData = await fs.readFile(filePath);
                    zip.file(relativeFilePath, fileData); // Add file to zip
                }
            }
        };

        // Add the entire temp folder to the zip object
        await addFolderToZip(baseFolderPath, "");
        const archive = await zip.generateAsync({ type: "blob" });

        //send zipped file to client
        return new Response(archive);

    } else if (seenDownloadProjectBody.downloadOption === "github") {
        //donothing if github
        return NextResponse.json({ message: "all good" })
    }
}


