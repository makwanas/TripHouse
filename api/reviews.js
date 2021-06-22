/*
 * API sub-router for reviews collection endpoints.
 */

const {requireReviewUserId} = require("../lib/auth");
const {deleteReviewById} = require("../models/review");
const {replaceReviewById} = require("../models/review");
const {getReviewById} = require("../models/review");
const {insertNewReview} = require("../models/review");
const {hasUserReviewedBusiness} = require("../models/review");
const {requireAuthentication} = require("../lib/auth");
const {verifyTokenWithEmail} = require("../lib/auth");
const router = require('express').Router()
const {validateAgainstSchema} = require('../lib/validation')

const {
    ReviewSchema
} = require('../models/review')

/*
 * Route to create a new review.
 */
router.post('/', requireAuthentication, verifyTokenWithEmail, async (req, res, next) => {
    if (validateAgainstSchema(req.body, ReviewSchema)) {
        try {
            const alreadyReviewed = await hasUserReviewedBusiness(req.body.userid, req.body.businessid)
            // console.log('Already reviewed ==> ', alreadyReviewed)
            if (alreadyReviewed) {
                res.status(403).send({
                    error: 'User has already posted a review of this business.'
                })
            } else {
                const id = await insertNewReview(req.body)
                res.status(201).send({
                    id: id,
                    links: {
                        review: `/reviews/${id}`,
                        business: `/businesses/${req.body.businessid}`
                    }
                })
            }
        } catch (err) {
            res.status(500).send({
                error: 'Error inserting review into DB.     Please try again later.'
            })
        }
    } else {
        res.status(400).send({
            error: 'Request body is not a valid review object.'
        })
    }
})

/*
 * Route to fetch info about a specific review.
 */
router.get('/:id', async (req, res, next) => {
    try {
        const review = await getReviewById(req.params.id);
        if (review) {
            res.status(200).send(review);
        } else {
            next();
        }
    } catch (err) {
        console.error(err);
        res.status(500).send({
            error: 'Unable to fetch review.  Please try again later.'
        });
    }
});

/*
 * Route to update a review.
 */
router.put('/:id', requireAuthentication, requireReviewUserId, verifyTokenWithEmail, async (req, res, next) => {
    if (validateAgainstSchema(req.body, ReviewSchema)) {
        try {
            /*
             * Make sure the updated review has the same businessID and userID as
             * the existing review.  If it doesn't, respond with a 403 error.  If the
             * review doesn't already exist, respond with a 404 error.
             */
            const existingReview = await getReviewById(req.params.id);
            if (existingReview) {
                if (req.body.businessid === existingReview.businessid && req.body.userid === existingReview.userid) {
                    const updateSuccessful = await replaceReviewById(req.params.id, req.body);
                    if (updateSuccessful) {
                        res.status(200).send({
                            links: {
                                business: `/businesses/${req.body.businessid}`,
                                review: `/reviews/${req.params.id}`
                            }
                        });
                    } else {
                        next();
                    }
                } else {
                    res.status(403).send({
                        error: "Updated review must have the same businessID and userID"
                    });
                }
            } else {
                next();
            }
        } catch (err) {
            console.error(err);
            res.status(500).send({
                error: "Unable to update review.  Please try again later."
            });
        }
    } else {
        res.status(400).send({
            error: "Request body is not a valid review object."
        });
    }
});

/*
 * Route to delete a review.
 */
router.delete('/:id', requireAuthentication, requireReviewUserId, verifyTokenWithEmail, async (req, res, next) => {
    try {
        const deleteSuccessful = await deleteReviewById(req.params.id);
        if (deleteSuccessful) {
            res.status(204).end();
        } else {
            next();
        }
    } catch (err) {
        console.error(err);
        res.status(500).send({
            error: "Unable to delete review.  Please try again later."
        });
    }
});

module.exports = router