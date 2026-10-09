import cloudinary from "../config/cloudinary.js";

export function uploadToCloudinary(
    buffer,
    folder = "lumina/avatars"
) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: "image"
            },
            (error, result) => {
                if (error) {
                    return reject(error);
                }

                resolve(result);
            }
        );

        stream.end(buffer);
    });
}