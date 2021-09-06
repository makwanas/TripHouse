/*
 * Review schema and data accessor methods;
 */

const {ObjectId} = require('mongodb');

const {getDBReference} = require('../lib/mongo');
const {extractValidFields} = require('../lib/validation');

/*
 * Schema describing required/optional fields of a review object.
 */
const ReviewSchema = {
    userid: {required: true},
    lodgingid: {required: true},
    dollars: {required: true},
    stars: {required: true},
    review: {required: false}
};
exports.ReviewSchema = ReviewSchema;

/*
 * Executes a MongoDB query to verify whether a given user has already reviewed
 * a specified lodging.  Returns a Promise that resolves to true if the
 * specified user has already reviewed the specified lodging or false
 * otherwise.
 */
const hasUserReviewedLodging = async (userid, lodgingid) => {
    const db = getDBReference()
    const collection = db.collection('reviews')
    if (!ObjectId.isValid(userid)) {
        return null
    } else {
        const results = await collection
            .find({userid: userid, lodgingid: lodgingid})
            .toArray();

        // console.log('Result ==> ', results)
        return results.length > 0
    }
}
exports.hasUserReviewedLodging = hasUserReviewedLodging

/*
 * Executes a MongoDB query to insert a new review into the database.  Returns
 * a Promise that resolves to the ID of the newly-created review entry.
 */
const insertNewReview = async (review) => {
    review = extractValidFields(review, ReviewSchema)
    const db = getDBReference()
    const collection = db.collection('reviews')
    const result = await collection.insertOne(review)
    //console.log('Result ==> ', result)
    return result.insertedId;
}
exports.insertNewReview = insertNewReview;

/*
 * Executes a MongoDB query to fetch a single specified review based on its ID.
 * Returns a Promise that resolves to an object containing the requested
 * review.  If no review with the specified ID exists, the returned Promise
 * will resolve to null.
 */
const getReviewById = async (id) => {
    const db = getDBReference();
    const collection = db.collection('reviews');
    if (!ObjectId.isValid(id)) {
        return null;
    } else {
        const results = await collection
            .find({_id: new ObjectId(id)})
            .toArray();
        console.log('Results ==> ', results)
        return results[0];
    }
}
exports.getReviewById = getReviewById;

/*
 * Executes a MongoDB query to replace a specified review with new data.
 * Returns a Promise that resolves to true if the review specified by
 * `id` existed and was successfully updated or to false otherwise.
 */
async function replaceReviewById(id, review) {
    review = extractValidFields(review, ReviewSchema);
    const db = getDBReference();
    const collection = db.collection('reviews');
    if (!ObjectId.isValid(id)) {
        return null
    } else {
        const query = {_id: ObjectId(id)}
        const newValues = {$set: review}
        const result = await collection.updateOne(query, newValues)
        return result
    }
}
exports.replaceReviewById = replaceReviewById;

/*
 * Executes a MongoDB query to delete a review specified by its ID.  Returns
 * a Promise that resolves to true if the review specified by `id`
 * existed and was successfully deleted or to false otherwise.
 */
async function deleteReviewById(id) {
    const db = getDBReference();
    const collection = db.collection('reviews');
    if (!ObjectId.isValid(id)) {
        return null
    } else {
        const query = {_id: ObjectId(id)}
        const result = await collection.deleteOne(query)
        return result
    }
}
exports.deleteReviewById = deleteReviewById;

/*
 * Executes a MongoDB query to fetch all reviews for a specified lodging, based
 * on the lodging's ID.  Returns a Promise that resolves to an array
 * containing the requested reviews.  This array could be empty if the
 * specified lodging does not have any reviews.  This function does not verify
 * that the specified lodging ID corresponds to a valid lodging.
 */
async function getReviewsByLodgingId(id) {
    const db = getDBReference();
    const collection = db.collection('reviews');
    if (!ObjectId.isValid(id)) {
        return [];
    } else {
        const results = await collection
            .find({lodgingid: id})
            .toArray();
        return results;
    }
}
exports.getReviewsByLodgingId = getReviewsByLodgingId;

/*
 * Executes a MongoDB query to fetch all reviews by a specified user, based on
 * on the user's ID.  Returns a Promise that resolves to an array containing
 * the requested reviews.  This array could be empty if the specified user
 * does not have any reviews.  This function does not verify that the specified
 * user ID corresponds to a valid user.
 */
async function getReviewsByUserId(id) {
    const db = getDBReference();
    const collection = db.collection('reviews');
    if (!ObjectId.isValid(id)) {
        return null;
    } else {
        const results = await collection
            .find({userid: id})
            .toArray();
        return results;
    }
}
exports.getReviewsByUserId = getReviewsByUserId;