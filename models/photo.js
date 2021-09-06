/*
 * Photo schema and data accessor methods.
 */

const fs = require('fs')
const {ObjectId, GridFSBucket} = require('mongodb')
const multer = require('multer')
const crypto = require('crypto')
const {getDBReference} = require('../lib/mongo');
const {extractValidFields} = require('../lib/validation');

/*
 * Schema describing required/optional fields of a photo object.
 */
const PhotoSchema = {
    lodgingid: {required: true},
    caption: {required: false}
};
exports.PhotoSchema = PhotoSchema;

const imageTypes = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif'
};

exports.upload = multer({
    storage: multer.diskStorage({
        destination: `${__dirname}/uploads`,
        filename: (req, file, callback) => {
            const basename = crypto.pseudoRandomBytes(16).toString('hex');
            const extension = imageTypes[file.mimetype];
            callback(null, `${basename}.${extension}`);
        }
    }),
    fileFilter: (req, file, callback) => {
        callback(null, !!imageTypes[file.mimetype])
    }
});

exports.saveImageFile = function (image) {
    return new Promise((resolve, reject) => {
        const db = getDBReference();
        const bucket = new GridFSBucket(db, {bucketName: 'photos'});

        const metadata = {
            contentType: image.contentType,
            userid: image.userid,
            lodgingid: image.lodgingid,
            caption: image.caption,
        };

        const uploadStream = bucket.openUploadStream(
            image.filename,
            {metadata: metadata}
        );

        fs.createReadStream(image.path)
            .pipe(uploadStream)
            .on('error', (err) => {
                reject(err);
            })
            .on('finish', (result) => {
                resolve(result._id);
            });
    });
};

exports.getDownloadStreamByFilename = function (filename) {
    const db = getDBReference();
    const bucket = new GridFSBucket(db, {bucketName: 'photos'});
    return bucket.openDownloadStreamByName(filename);
};


/*
 * Executes a DB query to insert a new photo into the database.  Returns
 * a Promise that resolves to the ID of the newly-created photo entry.
 */
async function insertNewPhoto(photo) {
    photo = extractValidFields(photo, PhotoSchema);
    photo.lodgingid = ObjectId(photo.lodgingid);
    const db = getDBReference();
    const collection = db.collection('photos');
    const result = await collection.insertOne(photo);
    return result.insertedId;
}

exports.insertNewPhoto = insertNewPhoto;

const updatePhoto = async (id, filename, ids, urls) => {
    const db = getDBReference()
    // const bucket = new GridFSBucket(db, {bucketName:'photos'})
    const collection = db.collection('photos.files')
    if (ObjectId.isValid(id)) {
        const query = {_id: ObjectId(id)}
        const newValues = {$set: {ids: ids, urls: urls, filename: filename}}
        const result = await collection.updateOne(query, newValues)
        console.log('Result ==> ', result)
    } else {
        return null
    }
}
exports.updatePhoto = updatePhoto

/*
 * Executes a DB query to fetch a single specified photo based on its ID.
 * Returns a Promise that resolves to an object containing the requested
 * photo.  If no photo with the specified ID exists, the returned Promise
 * will resolve to null.
 */
async function getPhotoById(id) {

    /* Alternative way */
    // const db = getDBReference();
    // const collection = db.collection('photos.files');
    // if (!ObjectId.isValid(id)) {
    //   return null;
    // } else {
    //   const results = await collection
    //     .find({ _id: new ObjectId(id) })
    //     .toArray();
    //   return results[0];
    // }

    const db = getDBReference()
    const bucket = new GridFSBucket(db, {bucketName: 'photos'})
    if (!ObjectId.isValid(id)) {
        return null
    } else {
        const results = await bucket.find({_id: new ObjectId(id)})
            .toArray()
        return results[0]
    }
}

exports.getPhotoById = getPhotoById;

/*
 * Executes a DB query to fetch all photos for a specified lodging, based
 * on the lodging's ID.  Returns a Promise that resolves to an array
 * containing the requested photos.  This array could be empty if the
 * specified lodging does not have any photos.  This function does not verify
 * that the specified lodging ID corresponds to a valid lodging.
 */
async function getPhotosByLodgingId(id) {
    /* Alternative way */
    // const db = getDBReference();
    // const collection = db.collection('photos.files');
    // if (!ObjectId.isValid(id)) {
    //   return [];
    // } else {
    //   const results = await collection
    //     .find({ "metadata.lodgingid": id })
    //     .toArray();
    //   return results;
    // }

    const db = getDBReference()
    const bucket = new GridFSBucket(db, {bucketName: 'photos'})
    if (!ObjectId.isValid(id)) {
        return []
    } else {
        const results = await bucket
            .find({"metadata.lodgingid": id})
            .toArray()
        return results
    }
}

/*
 * Executes a DB query to fetch all photos for a specified user, based
 * on the user's ID.  Returns a Promise that resolves to an array
 * containing the requested photos.  This array could be empty if the
 * specified lodging does not have any photos.  This function does not verify
 * that the specified user ID corresponds to a valid user.
 */
const getPhotosByUserId = async (id) => {
    const db = getDBReference()
    const bucket = new GridFSBucket(db, {bucketName: 'photos'})
    if (!ObjectId.isValid(id)) {
        return []
    } else {
        const results = await bucket
            .find({"metadata.userid": ObjectId(id)})
            .toArray()
        return results
    }
}
exports.getPhotosByUserId = getPhotosByUserId


exports.getPhotosByLodgingId = getPhotosByLodgingId;

const deletePhotosById = async (id) => {
    const db = getDBReference()
    const bucket = new GridFSBucket(db, {bucketName: 'photos'})
    if (!ObjectId.isValid(id)) {
        return null
    } else {
        const photo = await getPhotoById(id)

        // Delete resized photos
        await Object.keys(photo.ids).forEach(size => {
            console.log('Photo ==> ', photo.ids[size])
            bucket.delete(photo.ids[size], (err) => {
                if (err) {
                    console.log('GridFS deleting error ==> ', err)
                }
            })
        })
        // Later delete original photo
        await bucket.delete(photo._id, (err) => {
            if (err) {
                console.log('GridFS deleting error ==> ', err)
            }
        })
        return 'Success'
    }
}
exports.deletePhotosById = deletePhotosById

const replacePhotoById = async (id, photo) => {
    photo = extractValidFields(photo, PhotoSchema)
    const db = getDBReference()
    const collection = db.collection('photos.files')
    if (!ObjectId.isValid(id)) {
        return null
    } else {
        const query = {_id: ObjectId(id)}
        const newBody = {}
        Object.keys(photo).forEach((key) => {
            newBody[`metadata.${key}`] = photo[key]
        })
        console.log('New Body ==> ', newBody)
        const newValues = {$set: newBody}
        const result = await collection.updateOne(query, newValues)
        return result
    }
}
exports.replacePhotoById = replacePhotoById

/*
 * Worker section
 */
exports.getDownloadStreamById = function (id) {
    const db = getDBReference()
    const bucket = new GridFSBucket(db, {bucketName: 'photos'})
    if (!ObjectId.isValid(id)) {
        return null
    } else {
        return bucket.openDownloadStream(new ObjectId(id))
    }
}
