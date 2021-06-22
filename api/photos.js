/*
 * API sub-router for businesses collection endpoints.
 */

const router = require('express').Router();
const fs = require('fs/promises')
const {replacePhotoById} = require("../models/photo");
const {deletePhotosById} = require("../models/photo");
const {requirePhotoUserId} = require("../lib/auth");
const {requireBusinessOwnerId} = require("../lib/auth");
const {verifyTokenWithEmail} = require("../lib/auth");
const {requireAuthentication} = require("../lib/auth");
const {getChannel} = require("../lib/rabbitmq");
const {validateAgainstSchema} = require('../lib/validation');
const {
    PhotoSchema,
    insertNewPhoto,
    getPhotoById
} = require('../models/photo');

const {upload, saveImageFile} = require('../models/photo')

/*
 * Route to create a new photo.
 */
router.post('/', requireAuthentication, upload.single('image'), requireBusinessOwnerId, verifyTokenWithEmail, async (req, res) => {
    console.log('Request body ==> ', req.body)
    console.log('Request file ==> ', req.file)

    if (validateAgainstSchema(req.body, PhotoSchema) && req.file) {
        try {
            // const photoid = await insertNewPhoto(req.body);
            const image = {
                path: req.file.path,
                filename: req.file.filename,
                contentType: req.file.mimetype,
                businessid: req.body.businessid,
                userid: req.user._id,
                caption: req.body.caption
            }
            const id = await saveImageFile(image);
            await fs.unlink(req.file.path);

            const channel = getChannel();
            channel.sendToQueue('images', Buffer.from(id.toString()));
            res.status(200).send({id: id});
        } catch (err) {
            console.error(err);
            res.status(500).send({
                error: "Error inserting photo into DB.  Please try again later."
            });
        }
    } else {
        res.status(400).send({
            error: "Request body is not a valid photo object"
        });
    }
});

/*
 * Route to fetch info about a specific photo.
 */
router.get('/:id', async (req, res, next) => {
    try {
        const photo = await getPhotoById(req.params.id);
        if (photo) {
            res.status(200).send(photo);
        } else {
            next();
        }
    } catch (err) {
        console.error(err);
        res.status(500).send({
            error: "Unable to fetch photo.  Please try again later."
        });
    }
});

/*
 * Route to delete a photo.
 */
router.delete('/:id', requireAuthentication, requirePhotoUserId, verifyTokenWithEmail, async (req, res, next) => {
    try {
        const deleteSuccessful = await deletePhotosById(req.params.id);
        if (deleteSuccessful) {
            res.status(204).end();
        } else {
            next();
        }
    } catch (err) {
        console.error(err);
        res.status(500).send({
            error: "Unable to delete photos.  Please try again later."
        });
    }
});

router.put('/:id', requireAuthentication, requirePhotoUserId, verifyTokenWithEmail, async (req, res, next) => {
    if (validateAgainstSchema(req.body, PhotoSchema)) {
        try {
            const updateSuccessful = await replacePhotoById(req.params.id, req.body)
            if (updateSuccessful) {
                res.status(200).send({
                    links: {
                        business: `/businesses/${req.body.businessid}`,
                        photo: `/photos/${req.user._id}`
                    }
                });
            } else {
                next()
            }
        } catch (err) {
            console.error(err);
            res.status(500).send({
                error: "Unable to update photo.  Please try again later."
            });
        }
    } else {
        res.status(400).send({
            error: "Request body is not a valid photo object."
        });
    }
})


module.exports = router;
