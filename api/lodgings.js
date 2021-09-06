/*
 * API sub-router for lodgings collection endpoints.
 */

const {requireLodgingOwnerId} = require("../lib/auth");
const {deleteLodgingById} = require("../models/lodging");
const {replaceLodgingById} = require("../models/lodging");
const {verifyTokenWithEmail} = require("../lib/auth");
const {requireAuthentication} = require("../lib/auth");
const router = require('express').Router();

const {validateAgainstSchema} = require('../lib/validation');
const {
    LodgingSchema,
    getLodgingsPage,
    insertNewLodging,
    getLodgingDetailsById
} = require('../models/lodging');

/*
 * Route to return a paginated list of lodgings.
 */
router.get('/', async (req, res) => {
    try {
        /*
         * Fetch page info, generate HATEOAS links for surrounding pages and then
         * send response.
         */
        const lodgingPage = await getLodgingsPage(parseInt(req.query.page) || 1);
        lodgingPage.links = {};
        if (lodgingPage.page < lodgingPage.totalPages) {
            lodgingPage.links.nextPage = `/lodgings?page=${lodgingPage.page + 1}`;
            lodgingPage.links.lastPage = `/lodgings?page=${lodgingPage.totalPages}`;
        }
        if (lodgingPage.page > 1) {
            lodgingPage.links.prevPage = `/lodgings?page=${lodgingPage.page - 1}`;
            lodgingPage.links.firstPage = '/lodgings?page=1';
        }
        res.status(200).send(lodgingPage);
    } catch (err) {
        console.error(err);
        res.status(500).send({
            error: "Error fetching lodgings list.  Please try again later."
        });
    }
});


/*
 * Route to fetch info about a specific lodging.
 */
router.get('/:id', async (req, res, next) => {
    try {
        const lodging = await getLodgingDetailsById(req.params.id);
        if (lodging) {
            res.status(200).send(lodging);
        } else {
            next();
        }
    } catch (err) {
        console.error(err);
        res.status(500).send({
            error: "Unable to fetch lodging.  Please try again later."
        });
    }
});

/*
 * Route to create a new lodging.
 */
router.post('/', requireAuthentication, verifyTokenWithEmail, async (req, res) => {
    if (validateAgainstSchema(req.body, LodgingSchema)) {
        try {
            const id = await insertNewLodging(req.body);
            res.status(201).send({
                id: id,
                links: {
                    lodging: `/lodgings/${id}`
                }
            });
        } catch (err) {
            console.error(err);
            res.status(500).send({
                error: "Error inserting lodging into DB.  Please try again later."
            });
        }
    } else {
        res.status(400).send({
            error: "Request body is not a valid lodging object."
        });
    }
});

/*
 * Route to replace data for a lodging.
 */
router.put('/:id', requireAuthentication, requireLodgingOwnerId, verifyTokenWithEmail, async (req, res, next) => {
    if (validateAgainstSchema(req.body, LodgingSchema)) {
        try {
            const id = req.params.id
            const updateSuccessful = await replaceLodgingById(id, req.body)
            if (updateSuccessful) {
                res.status(200).send({
                    links: {
                        lodging: `/lodgings/${id}`
                    }
                })
            } else {
                next()
            }
        } catch (err) {
            console.error(err)
            res.status(500).send({
                error: "Unable to update specified lodging.  Please try again later."
            })
        }
    } else {
        res.status(400).send({
            error: "Request body is not a valid lodging object"
        })
    }
})

/*
 * Route to delete a lodging.
 */
router.delete('/:id', requireAuthentication, requireLodgingOwnerId, verifyTokenWithEmail, async (req, res, next) => {
    try {
        const deleteSuccessful = await deleteLodgingById(req.params.id)
        if (deleteSuccessful) {
            res.status(204).end()
        } else {
            next()
        }
    } catch (err) {
        console.error(err)
        res.status(500).send({
            error: "Unable to delete lodging.  Please try again later."
        })
    }
})

module.exports = router;
