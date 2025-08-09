// import JSZip from "jszip";
// import path from "path";
// import fs from "fs/promises";
// import { requestDownloadWebsiteBodySchema, usedComponent } from "@/types";
// import { ensureUserCanAccessWebsite } from "@/useful/sessionCheck";
// import { getSpecificWebsite } from "@/serverFunctions/handleWebsites";
// import { websiteBuildsStagingAreaDir, websiteBuildsStarterDir, websiteTemplatesDir } from "@/lib/websiteTemplateLib";
// import { checkIfDirectoryExists, ensureDirectoryExists } from "@/utility/manageFiles";
// import { addScopeToCSS, getDescendedUsedComponents, getFontImportStrings, getUsedComponentsImportString, getUsedComponentsInSameLocation, makeUsedComponentsImplementationString, makeValidPageLinkName as makeValidPageLinkName, sortUsedComponentsByOrder } from "@/utility/utility";
// import { NextResponse } from "next/server";

// export async function POST(request: Request) {
//   //parse body
//   const requestDownloadWebsiteBody = requestDownloadWebsiteBodySchema.parse(await request.json())

//   //fetch website
//   const seenWebsite = await getSpecificWebsite({ option: "id", data: { "id": requestDownloadWebsiteBody.websiteId } })
//   if (seenWebsite === undefined) throw new Error("not seeing website")

//   //security check - ensure authed to download site
//   await ensureUserCanAccessWebsite(seenWebsite.userId, seenWebsite.authorisedUsers, true)

//   const baseFolderPath = path.join(process.cwd(), websiteBuildsStagingAreaDir, seenWebsite.id)

//   //if baseFolder already exists delete it
//   if (await checkIfDirectoryExists(baseFolderPath)) {
//     await fs.rm(baseFolderPath, { force: true, recursive: true })
//   }

//   //make baseFolder
//   await ensureDirectoryExists(baseFolderPath)

//   //get the starter files
//   const websiteBuildsStarterFolderPath = path.join(process.cwd(), websiteBuildsStarterDir)

//   //copy the starter to my base path
//   await fs.cp(websiteBuildsStarterFolderPath, baseFolderPath, { recursive: true })




//   //edit the package.json
//   const packageJsonFilePath = path.join(baseFolderPath, "package.json")

//   const packageJsonContent = await fs.readFile(packageJsonFilePath, "utf-8");
//   const packageJson = JSON.parse(packageJsonContent);

//   // Remove invalid characters (allow only a-z, 0-9, hyphens, underscores)
//   let sanitizedName = seenWebsite.name.replace(/[^a-z0-9-_]/g, '');
//   // Convert to lowercase
//   sanitizedName = sanitizedName.toLowerCase();
//   // Ensure no leading or trailing hyphens/underscores
//   sanitizedName = sanitizedName.replace(/^[-_]+|[-_]+$/g, '');

//   packageJson.name = sanitizedName;

//   await fs.writeFile(packageJsonFilePath, JSON.stringify(packageJson, null, 2));




//   //create the app folder
//   const appFolderPath = path.join(baseFolderPath, "app")
//   await ensureDirectoryExists(appFolderPath)




//   //make fav icon



//   //ensure website usedComponents seen
//   if (seenWebsite.usedComponents === undefined) throw new Error("not seeing usedComponents")




//   //make global.css
//   const globalsCssFilePath = path.join(appFolderPath, "globals.css")

//   //start off global css string
//   let combinedPageCssString = `@import "tailwindcss";\n\n${seenWebsite.globalCss}`

//   //write the css for all usedComponents
//   combinedPageCssString += seenWebsite.usedComponents.map(eachUsedComponent => {
//     const scopedUsedComponentCss = addScopeToCSS(eachUsedComponent.css, eachUsedComponent.id)

//     return `\n\n\n\n\n${scopedUsedComponentCss}\n\n\n\n\n`
//   }).join("")

//   //write the global.css file
//   await fs.writeFile(globalsCssFilePath, combinedPageCssString);




//   //make layout.tsx
//   const layoutFilePath = path.join(appFolderPath, "layout.tsx")

//   //get base usedComponents in location header and footer
//   const headerUsedComponents = getUsedComponentsInSameLocation({ type: "header" }, seenWebsite.usedComponents)
//   const footerUsedComponents = getUsedComponentsInSameLocation({ type: "footer" }, seenWebsite.usedComponents)

//   //order the components
//   const headerUsedComponentsOrdered = sortUsedComponentsByOrder(headerUsedComponents)
//   const footerUsedComponentsOrdered = sortUsedComponentsByOrder(footerUsedComponents)

//   //then get all their descendants for proper import
//   const headerAndFooterUsedComponents: usedComponent[] = [...headerUsedComponentsOrdered, ...footerUsedComponentsOrdered]
//   const allDescendedUsedComponents: usedComponent[] = getDescendedUsedComponents(headerAndFooterUsedComponents.map(e => e.id), seenWebsite.usedComponents)
//   const allUsedComponentsUsed: usedComponent[] = [...headerAndFooterUsedComponents, ...allDescendedUsedComponents]

//   //get all the needed import statements
//   const usedComponentsImportsText = getUsedComponentsImportString(allUsedComponentsUsed)

//   //get usedComponents in this location
//   const headerUsedComponentsText = makeUsedComponentsImplementationString(headerUsedComponentsOrdered, seenWebsite.usedComponents)
//   const footerUsedComponentsText = makeUsedComponentsImplementationString(footerUsedComponentsOrdered, seenWebsite.usedComponents)

//   //get global fonts
//   const seenFontImportStrings = getFontImportStrings(seenWebsite.fonts)

//   const layoutTsxFileString =
//     `${seenFontImportStrings.fontImportStr}
// import "./globals.css";
// import type { Metadata } from "next";
// ${usedComponentsImportsText}

// ${seenFontImportStrings.variableImplementationStr}

// export const metadata: Metadata = {
//   title: "${seenWebsite.title}",
//   description: "${seenWebsite.description}",
// };

// export default function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   return (
//     <html lang="en">
//       <body
//         className={\`${seenFontImportStrings.classNameImplementationStr} antialiased\`}
//       >
//         ${headerUsedComponentsText}

//         {children}

//         ${footerUsedComponentsText}
//       </body>
//     </html>
//   );
// }
// `
//   await fs.writeFile(layoutFilePath, layoutTsxFileString);




//   //make pages
//   if (seenWebsite.pages === undefined) throw new Error("not seeing pages")

//   await Promise.all(
//     seenWebsite.pages.map(async eachPage => {
//       if (seenWebsite.usedComponents === undefined) return

//       //ensure page link is possible
//       const validatedPageLinkName = makeValidPageLinkName(eachPage.link)

//       //create the page folder
//       const onHomePage = eachPage.link === "/"

//       //where to write new page
//       const pageFolderPath = onHomePage ? path.join(appFolderPath) : path.join(appFolderPath, validatedPageLinkName)

//       //make the page folder in the app directory
//       await ensureDirectoryExists(pageFolderPath)

//       //get base usedComponents on the page
//       const usedComponentsOnPage = getUsedComponentsInSameLocation({ type: "page", pageId: eachPage.id }, seenWebsite.usedComponents)

//       //order the components
//       const usedComponentsOnPageOrdered = sortUsedComponentsByOrder(usedComponentsOnPage)

//       //then get all their descendants for proper import
//       const allDescendedUsedComponents: usedComponent[] = getDescendedUsedComponents(usedComponentsOnPageOrdered.map(e => e.id), seenWebsite.usedComponents)
//       const allUsedComponentsUsed: usedComponent[] = [...usedComponentsOnPageOrdered, ...allDescendedUsedComponents]

//       //get all the needed import statements
//       const usedComponentsImportsText = getUsedComponentsImportString(allUsedComponentsUsed)

//       //get usedComponents in this location
//       const pageUsedComponentsText = makeUsedComponentsImplementationString(usedComponentsOnPageOrdered, seenWebsite.usedComponents)

//       //whats in the page.tsx file
//       const pageTsxFileString = `${usedComponentsImportsText}

// export default function ${onHomePage ? "Home" : "Page"}() {
//   return (
//     <>
//         ${pageUsedComponentsText}
//     </>
//   );
// }
// `

//       //page.tsx file path
//       const pageFilePath = path.join(pageFolderPath, "page.tsx")

//       //write to the actual file
//       await fs.writeFile(pageFilePath, pageTsxFileString);
//     })
//   )




//   //create the components folder
//   const componentsFolderPath = path.join(baseFolderPath, "components")
//   await ensureDirectoryExists(componentsFolderPath)

//   //hold all template ids for file copying
//   const allTemplateIdsToCopy: string[] = []
//   seenWebsite.usedComponents.map(eachUsedComponent => {
//     if (!allTemplateIdsToCopy.includes(eachUsedComponent.templateId)) {
//       allTemplateIdsToCopy.push(eachUsedComponent.templateId)
//     }
//   })

//   //all templates lcoation on main website
//   const websiteTemplatesFolderPath = path.join(process.cwd(), websiteTemplatesDir)

//   //copy all the used template's component files to the components folder
//   await Promise.all(allTemplateIdsToCopy.map(async eachTemplateId => {
//     //where copying from
//     const websiteTemplateIndividualFolderPath = path.join(websiteTemplatesFolderPath, eachTemplateId)

//     //where to copy to
//     const individualComponentsFolderPath = path.join(componentsFolderPath, eachTemplateId)

//     //copy from the websiteTemplatesDir to the local components directory
//     await fs.cp(websiteTemplateIndividualFolderPath, individualComponentsFolderPath, { recursive: true })
//   }))

//   //create the public folder
//   const publicFolderPath = path.join(baseFolderPath, "public")
//   await ensureDirectoryExists(publicFolderPath)




//   //build types file



//   if (requestDownloadWebsiteBody.downloadOption === "zip") {
//     //zip the folder
//     const zip = new JSZip();
//     // Function to recursively add files and directories to the zip object
//     const addFolderToZip = async (folderPath: string, relativePath: string) => {
//       const files = await fs.readdir(folderPath);

//       for (const file of files) {
//         const filePath = path.join(folderPath, file);
//         const relativeFilePath = path.join(relativePath, file);
//         const stats = await fs.stat(filePath);

//         if (stats.isDirectory()) {
//           await addFolderToZip(filePath, relativeFilePath); // Recursively add subdirectories

//         } else {
//           const fileData = await fs.readFile(filePath);
//           zip.file(relativeFilePath, fileData); // Add file to zip
//         }
//       }
//     };

//     // Add the entire temp folder to the zip object
//     await addFolderToZip(baseFolderPath, "");
//     const archive = await zip.generateAsync({ type: "blob" });

//     //send zipped file to client
//     return new Response(archive);

//   } else if (requestDownloadWebsiteBody.downloadOption === "github") {
//     //donothing if github
//     return NextResponse.json({ message: "all good" })
//   }
// }


