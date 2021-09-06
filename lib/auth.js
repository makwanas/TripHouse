const jwt = require('jsonwebtoken')
const {getReviewById} = require("../models/review");
const {getPhotoById} = require("../models/photo");
const {getLodgingById} = require("../models/lodging");
const {getUserById} = require("../models/user");

const secretKey = 'secretKey'
const admin = 'admin@lodgings.com'
exports.admin = admin

exports.generateAuthToken = (userEmail) => {
    const payload = {sub: userEmail}
    return jwt.sign(payload, secretKey, {expiresIn: '24h'})
}

exports.requireAuthentication = async (req, res, next) => {
    // console.log('   -- Verifying authentication...')
    const authHeader = req.get('Authorization') || ''
    const authHeaderParts = authHeader.split(' ')
    // console.log('   -- authHeaderParts: ', authHeaderParts)
    const token = authHeaderParts[0] === 'Bearer' ? authHeaderParts[1] : null

    try {
        const payload = jwt.verify(token, secretKey)
        // console.log('   -- payload ', payload)

        // req.user is going to be used in the next middleware
        req.userEmail = payload.sub
        next()
    } catch (err) {
        res.status(401).send({
            err: 'Invalid authentication token'
        })
    }
}

// req.userEmail is the field for email acquired from the previous middleware requireAuthentication
const verifyTokenWithEmail = async (req, res, next) => {
    try {
        const userId = req.body.userid || req.userid || req.body.ownerid || req.ownerid || req.params.id
        const user = await getUserById(userId, false)
        // console.log('User ==> ', user)
        // console.log('Token Email ==> ', req.userEmail)
        if (user === undefined) {
            res.status(401).send({
                error: `User ${userId} not found`
            })
        } else {
            if (req.userEmail !== admin && req.userEmail !== user.email) {
                res.status(403).send({
                    error: 'Unauthorized to access the specified resource.'
                })
            } else {
                req.user = user
                next()
            }
        }
    } catch (err) {
        console.log(' -- Error:', err)
        res.status(500).send({
            error: 'Error fetching email.   Try again later.'
        })
    }
}
exports.verifyTokenWithEmail = verifyTokenWithEmail

const requireLodgingOwnerId = async (req, res, next) => {
    try {
        const id = req.params.id || req.body.lodgingid
        const result = await getLodgingById(id)
        // console.log('Here ==> ', req, id, result)
        // console.log(' -- Result:', result)
        const ownerId = result.ownerid
        // console.log(' -- OwnerId:', ownerId)
        if (ownerId) {
            req.ownerid = ownerId
            next()
        } else {
            res.status(500).send({
                error: 'Error fetching ownerid.     Try again later.'
            })
        }
    } catch (err) {
        console.log(' -- Error:', err)
        res.status(500).send({
            error: 'Error fetching lodging.   Try again later.'
        })
    }
}
exports.requireLodgingOwnerId = requireLodgingOwnerId

const requirePhotoUserId = async (req, res, next) => {
    try {
        const id = req.params.id
        const result = await getPhotoById(id)
        // console.log(' -- Result:', result)
        const userid = result.metadata.userid
        // console.log(' -- Userid:', userid)
        if (userid) {
            req.userid = userid
            next()
        } else {
            res.status(500).send({
                error: 'Error fetching userid.     Try again later.'
            })
        }
    } catch (err) {
        console.log(' -- Error:', err)
        res.status(500).send({
            error: 'Error fetching review.   Try again later.'
        })
    }
}
exports.requirePhotoUserId = requirePhotoUserId

const requireReviewUserId = async (req, res, next) => {
    try {
        const id = req.params.id
        const result = await getReviewById(id)
        console.log(' -- Result:', result)
        const userid = result.userid
        console.log(' -- UserId:', userid)
        if (userid) {
            req.userid = userid
            next()
        } else {
            res.status(500).send({
                error: 'Error fetching userid.     Try again later.'
            })
        }
    } catch (err) {
        console.log(' -- Error:', err)
        res.status(500).send({
            error: 'Error fetching review.   Try again later.'
        })
    }
}
exports.requireReviewUserId = requireReviewUserId
