/*
 * API sub-router for businesses collection endpoints.
 */

const {getPhotosByUserId} = require("../models/photo");
const {getPhotosByBusinessId} = require("../models/photo");
const {getReviewsByUserId} = require("../models/review");
const {getReviewsByBusinessId} = require("../models/review");
const {getBusinessByOwnerId} = require("../models/business");
const {getBusinessById} = require("../models/business");
const {verifyTokenWithEmail} = require("../lib/auth");
const {getUserById} = require("../models/user");
const {requireAuthentication} = require("../lib/auth");
const {generateAuthToken, admin} = require("../lib/auth");
const router = require('express').Router()

const {validateAgainstSchema} = require('../lib/validation')

const {
    UserSchema,
    LoginSchema,
    insertNewUser,
    validateUser
} = require('../models/user')

/*
 * Route to create a new user.
 */
router.post('/', async (req, res, next) => {
    if (validateAgainstSchema(req.body, UserSchema)) {
        try {
            const id = await insertNewUser(req.body)
            res.status(201).send({
                id: id,
                links: {
                    user: `/users/${id}`
                }
            })
        } catch (err) {
            console.log(err)
            res.status(500).send({
                error: 'Error inserting user into DB.   Please try again later.'
            })
        }
    } else {
        res.status(400).send({
            error: 'Request body is not a valid user object.'
        })
    }
})

router.post('/login', async (req, res, next) => {
    if (validateAgainstSchema(req.body, LoginSchema)) {
        try {
            const authenticated = await validateUser(req.body.email, req.body.password)
            if (authenticated) {
                res.status(200).send({
                    token: generateAuthToken(req.body.email)
                })
            } else {
                res.status(400).send({
                    error: 'Invalid authentication credentials.'
                })
            }
        } catch (err) {
            res.status(500).send({
                error: 'Error logging in.   Try again later.'
            })
        }
    } else {
        res.status(400).send({
            error: 'Request body needs `id` and `password`.'
        })
    }
})

/*
 * Route to fetch info about a specific user.
 */
router.get('/:id', requireAuthentication, verifyTokenWithEmail, async (req, res, next) => {
    try {
        if (req.userEmail !== req.user.email && req.userEmail !== admin) {
            res.status(403).send({
                error: 'Unauthorized to access the specified resource.'
            })
        } else {
            res.status(200).send(req.user)
        }

    } catch (err) {
        console.error(err);
        res.status(500).send({
            error: "Unable to fetch user.  Please try again later."
        });
    }
})

/*
 * Route to list all of a user's businesses.
 */
router.get('/:id/businesses', requireAuthentication, verifyTokenWithEmail, async (req, res, next) => {
    try {
        const businesses = await getBusinessByOwnerId(req.params.id)
        // console.log('Here ==> ', businesses)
        if (businesses) {
            res.status(200).send(businesses)
        } else {
            next()
        }
    } catch (err) {
        console.error(err)
        res.status(500).send({
            error: "Unable to fetch businesses.  Please try again later."
        })
    }
})

/*
 * Route to list all of a user's reviews.
 */
router.get('/:id/reviews', requireAuthentication, verifyTokenWithEmail, async (req, res, next) => {
    try {
        const reviews = await getReviewsByUserId(req.params.id)
        console.log('Here ==> ', reviews)
        if (reviews) {
            res.status(200).send(reviews)
        } else {
            next()
        }
    } catch (err) {
        console.error(err)
        res.status(500).send({
            error: "Unable to fetch reviews.  Please try again later."
        })
    }
})

/*
 * Route to list all of a user's photos.
 */
router.get('/:id/photos', requireAuthentication, verifyTokenWithEmail, async (req, res, next) => {
    try {
        const photos = await getPhotosByUserId(req.params.id)
        console.log('Here ==> ', photos)
        if (photos) {
            res.status(200).send(photos)
        } else {
            next()
        }
    } catch (err) {
        console.error(err)
        res.status(500).send({
            error: "Unable to fetch photos.  Please try again later."
        })
    }
})

module.exports = router