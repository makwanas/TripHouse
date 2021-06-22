const fs = require('fs')
const jimp = require('jimp')
const sizeOf = require('image-size');

const {connectToDB, getDBReference} = require('./lib/mongo');
const {connectToRabbitMQ, getChannel} = require('./lib/rabbitmq');
const {getDownloadStreamById, getPhotoById, updatePhoto} = require('./models/photo');
const {GridFSBucket} = require("mongodb");

connectToDB(async () => {
    await connectToRabbitMQ('images')
    const channel = getChannel()

    channel.consume('images', async msg => {
        // id here is photoid
        const id = msg.content.toString();
        console.log('== got message with id', id)

        const photo = await getPhotoById(id)
        console.log('Photo ==> ', photo)

        const sizes = [128, 256, 640, 1024]

        const imageChunks = []
        getDownloadStreamById(id)
            .on('data', chunk => {
                imageChunks.push(chunk)
            })
            .on('end', async () => {

                // This is where we generate new image sizes offline

                const db = getDBReference();
                const bucket = new GridFSBucket(db, {bucketName: 'photos'});
                const sourceImage = Buffer.concat(imageChunks)
                const sizeSourceImage = sizeOf(sourceImage)
                console.log('Origin picture size ==> ', sizeSourceImage)
                const image = await jimp.read(sourceImage)
                let urls = {}
                let ids = {}
                const updatedFilename = `${photo._id}--orig.jpg`
                urls["orig"] = `media/photos/${updatedFilename}`
                for (const size of sizes) {
                    if (sizeSourceImage.width > size) {
                        try {
                            // resize(width, height)
                            const buffer = await image.resize(size, jimp.AUTO).getBufferAsync(jimp.MIME_JPEG)
                            const metadata = {
                                contentType: 'image/jpeg',
                                size: sizeOf(buffer)
                            }
                            console.log('Metadata ==> ', metadata)
                            const filename = `${photo._id}--${size}.jpg`
                            const uploadStream = bucket.openUploadStream(
                                filename,
                                {metadata: metadata}
                            );
                            urls[size] = `media/photos/${photo._id}--${size}.jpg`

                            uploadStream.write(buffer)
                            uploadStream.end()
                            ids[size] = uploadStream.id
                        } catch (err) {
                            console.log('Error ==> ', err)
                        }
                    }
                }
                console.log('Resized File Ids ==> ', ids)
                console.log('Urls ==> ', urls)
                console.log('Id ==> ', photo._id)
                await updatePhoto(photo._id, updatedFilename, ids, urls)
            })

        /* Worker has done this job! */
        channel.ack(msg)
    })

})
