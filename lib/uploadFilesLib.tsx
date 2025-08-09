// import path from "path";

export const maxFileUploadSize = 5 * 1024 * 1024; // 5 MB limit
export const maxBodyToServerSize = 100 * 1024 * 1024  //100 MB limit

// export const uploadedImagesDirectory = path.join(process.cwd(), "uploadedFiles", "images")
export const allowedImageFileTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp', 'image/svg+xml', 'image/tiff'];
export const imageFileInputAccept = '.jpg,.jpeg,.png,.webp,.bmp,.svg,.tiff'