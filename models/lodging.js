/*
 * Lodging schema and data accessor methods;
 */

const {getReviewsByLodgingId} = require("./review");
const {ObjectId} = require('mongodb');

const {getDBReference} = require('../lib/mongo');
const {extractValidFields} = require('../lib/validation');
const {getPhotosByLodgingId} = require('./photo');

/*
 * Schema describing required/optional fields of a Lodging object.
 *
 * Todo: Remove ownerId. OwnerId can be accessed once token is verified.
 */
const LodgingSchema = {
    name: {required: true},
    address: {required: true},
    city: {required: true},
    state: {required: true},
    zip: {required: true},
    category: {required: true},
    subcategory: {required: true},
    website: {required: false},
    email: {required: false},
    ownerid: {required: true}
};
exports.LodgingSchema = LodgingSchema;

/*
 * Executes a DB query to return a single page of Lodgings.  Returns a
 * Promise that resolves to an array containing the fetched page of Lodgings.
 */
async function getLodgingsPage(page) {
    const db = getDBReference();
    const collection = db.collection('lodgings');
    const count = await collection.countDocuments();

    /*
     * Compute last page number and make sure page is within allowed bounds.
     * Compute offset into collection.
     */
    const pageSize = 10;
    const lastPage = Math.ceil(count / pageSize);
    page = page > lastPage ? lastPage : page;
    page = page < 1 ? 1 : page;
    const offset = (page - 1) * pageSize;

    const results = await collection.find({})
        .sort({_id: 1})
        .skip(offset)
        .limit(pageSize)
        .toArray();

    return {
        lodgings: results,
        page: page,
        totalPages: lastPage,
        pageSize: pageSize,
        count: count
    };
}

exports.getLodgingsPage = getLodgingsPage;

/*
 * Executes a DB query to insert a new Lodging into the database.  Returns
 * a Promise that resolves to the ID of the newly-created Lodging entry.
 */
async function insertNewLodging(lodging) {
    lodging = extractValidFields(lodging, LodgingSchema);
    const db = getDBReference();
    const collection = db.collection('lodgings');
    const result = await collection.insertOne(lodging);
    return result.insertedId;
}

exports.insertNewLodging = insertNewLodging;

/*
 * Executes a DB query to fetch information about a single specified
 * Lodging based on its ID.  Does not fetch photo data for the
 * Lodging.  Returns a Promise that resolves to an object containing
 * information about the requested Lodging.  If no Lodging with the
 * specified ID exists, the returned Promise will resolve to null.
 */
async function getLodgingById(id) {
    const db = getDBReference();
    const collection = db.collection('lodgings');
    if (!ObjectId.isValid(id)) {
        return null;
    } else {
        const results = await collection
            .find({_id: new ObjectId(id)})
            .toArray();
        return results[0];
    }
}

exports.getLodgingById = getLodgingById

/*
 * Executes a DB query to fetch detailed information about a single
 * specified Lodging based on its ID, including photo data for
 * the Lodging.  Returns a Promise that resolves to an object containing
 * information about the requested Lodging.  If no Lodging with the
 * specified ID exists, the returned Promise will resolve to null.
 */
async function getLodgingDetailsById(id) {
    /*
     * Execute three sequential queries to get all of the info about the
     * specified Lodging, including its photos.
     */
    const lodging = await getLodgingById(id);
    if (lodging) {
        lodging.photos = await getPhotosByLodgingId(id);
        lodging.reviews = await getReviewsByLodgingId(id)
    }
    return lodging;
}
exports.getLodgingDetailsById = getLodgingDetailsById;

const replaceLodgingById = async (id, lodging) => {
    lodging = extractValidFields(lodging, LodgingSchema);
    const db = getDBReference();
    const collection = db.collection('lodgings');
    if (!ObjectId.isValid(id)) {
        return null
    } else {
        const query = {_id: ObjectId(id)}
        const newValues = {$set: lodging}
        const result = await collection.updateOne(query, newValues)
        return result
    }
}
exports.replaceLodgingById = replaceLodgingById

const deleteLodgingById = async (id) => {
    const db = getDBReference();
    const collection = db.collection('lodgings');
    if (!ObjectId.isValid(id)) {
        return null
    } else {
        const query = {_id: ObjectId(id)}
        const result = await collection.deleteOne(query)
        return result
    }
}
exports.deleteLodgingById = deleteLodgingById

const getLodgingByOwnerId = async (id) => {
    const db = getDBReference();
    const collection = db.collection('lodgings');
    if (!ObjectId.isValid(id)) {
        return null;
    } else {
        const results = await collection
            .find({ownerid: id})
            .toArray();
        console.log('Result ==> ', results)
        return results;
    }
}
exports.getLodgingByOwnerId = getLodgingByOwnerId