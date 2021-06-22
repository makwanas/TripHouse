/*
 * User schema and data accessor methods;
 */

const {ObjectId} = require('mongodb');
const bcrypt = require('bcryptjs')
const {getDBReference} = require('../lib/mongo');
const {extractValidFields} = require('../lib/validation');

/*
 * Schema for a User.
 */
const UserSchema = {
    name: {required: true},
    email: {required: true},
    password: {required: true},
    admin: {required: true}
}
exports.UserSchema = UserSchema

const LoginSchema = {
    email: {required: true},
    password: {required: true}
}
exports.LoginSchema = LoginSchema

const insertNewUser = async (user) => {
    user = extractValidFields(user, UserSchema)
    user.password = await bcrypt.hash(user.password, 8)
    console.log(user)
    const db = getDBReference()
    const collection = db.collection('users')
    collection.createIndex( { email: 1 }, { unique: true } )
    const result = await collection.insertOne(user)
    return result.insertedId
}
exports.insertNewUser = insertNewUser

const getUserByEmail = async (email, includePassword) => {
    const db = getDBReference()
    const collection = db.collection('users')
    const projection = includePassword ? {} : {password: 0}
    const result = await collection
        .find({email: email})
        .project(projection)
        .toArray()
    return result[0]
}

const validateUser = async (email, password) => {
    const user = await getUserByEmail(email, true)
    return user && await bcrypt.compare(password, user.password)
}
exports.validateUser = validateUser

const getUserById = async (userId, includePassword) => {
    const db = getDBReference()
    const collection = db.collection('users')
    const projection = includePassword ? {} : {password: 0}
    const result = await collection
        .find({_id: new ObjectId(userId)})
        .project(projection)
        .toArray()
    return result[0]
}
exports.getUserById = getUserById

