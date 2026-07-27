import ImageKit from "@imagekit/nodejs";

const client = new ImageKit({
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY
});

async function uploadFile (file) {
    const result = client.files.upload({
        file,
        fileName: "coverImage"
    });
    return result
}

export default uploadFile;