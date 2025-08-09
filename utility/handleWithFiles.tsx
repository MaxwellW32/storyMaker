import { dbFileTypeType, dbWithFileType, uploadFileApiResponseSchema } from "@/types";
import toast from "react-hot-toast";
import { deepClone } from "./utility";

//handles upload/delete of any object containing the files key/value
export async function handleWithFiles<T extends dbWithFileType>(dbWithFileObjs: T[], formData: FormData | null, dbFileType: dbFileTypeType, serverFunctions?: {
    delete?: (dbWithFileObjs: T[]) => Promise<void>,
}): Promise<T[]> {
    console.log(`$dbWithFileObjs`, deepClone(dbWithFileObjs));

    //handle files 
    const dbWithFileObjsToUpload = dbWithFileObjs.filter(eachDbWithFileObjsToUpload => eachDbWithFileObjsToUpload.file.status === "to-upload")
    console.log(`$dbWithFileObjsToUpload`, deepClone(dbWithFileObjsToUpload));
    if (dbWithFileObjsToUpload.length > 0 && formData !== null) {
        //set upload type
        formData.append("type", dbFileType)

        const response = await fetch(`/api/files/upload`, {
            method: 'POST',
            body: formData,
        })
        //get the srcs of files uploaded - confirmation
        const seenNamesObj = await response.json()

        //validate
        const validatedUploadFileApiResponse = uploadFileApiResponseSchema.parse(seenNamesObj)
        const seenUploadedFileSrcs = validatedUploadFileApiResponse.names

        //notify
        toast.success(`${dbFileType} uploaded`)

        dbWithFileObjs = dbWithFileObjs.map(eachDbWithFileObj => {
            if (seenUploadedFileSrcs.includes(eachDbWithFileObj.file.src)) {
                //react obj refresher
                eachDbWithFileObj = { ...eachDbWithFileObj }
                eachDbWithFileObj.file = { ...eachDbWithFileObj.file }

                eachDbWithFileObj.file.status = "uploaded"
                eachDbWithFileObj.file.uploadedAlready = true
            }

            return eachDbWithFileObj
        })
    }

    const dbWithFileObjsToDelete = dbWithFileObjs.filter(eachDbWithFileObj => eachDbWithFileObj.file.status === "to-delete")
    console.log(`$dbWithFileObjsToDelete`, deepClone(dbWithFileObjsToDelete));
    if (dbWithFileObjsToDelete.length > 0) {
        //send for delete on server
        const deleteFromServer = dbWithFileObjsToDelete.filter(eachDbWithFileObjToDelete => eachDbWithFileObjToDelete.file.uploadedAlready)
        if (deleteFromServer.length > 0) {
            if (serverFunctions === undefined || serverFunctions.delete === undefined) throw new Error("need a delete from server method")

            //send items
            await serverFunctions.delete(deleteFromServer)
        }

        //delete locally
        dbWithFileObjs = dbWithFileObjs.filter(eachDbWithFileObj => {
            const notFoundInDeleteArray = dbWithFileObjsToDelete.find(eachDbWithFileObjToDelete => eachDbWithFileObjToDelete.file.src === eachDbWithFileObj.file.src) === undefined
            console.log(`$notFoundInDeleteArray`, deepClone(notFoundInDeleteArray));
            return notFoundInDeleteArray
        })
    }

    return [...dbWithFileObjs]
}