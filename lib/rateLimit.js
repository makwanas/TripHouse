const redis = require('redis')

const redisClient = redis.createClient(
    process.env.REDIS_PORT || '6379',
    process.env.REDIS_HOST || 'localhost'
)

const rateLimitWindowMS = 60000
const rateLimitMaxRequests = 5

// Todo: Authorized users may have more request quota
const getUserTokenBucket = (ip) => {
    return new Promise((resolve, reject) => {
        redisClient.hgetall(ip, (err, tokenBucket) => {
            if (err) {
                reject(err)
            } else if (tokenBucket) {
                tokenBucket.tokens = parseFloat(tokenBucket.tokens)
                resolve(tokenBucket)
            } else {
                resolve({
                    tokens: rateLimitMaxRequests,
                    last: Date.now()
                })
            }
        })
    })
}

const saveUserTokenBucket = (ip, tokenBucket) => {
    return new Promise((resolve, reject) => {
        redisClient.hmset(ip, tokenBucket, (err, resp) => {
            if (err) {
                reject(err)
            } else {
                resolve()
            }
        })
    })
}

exports.rateLimit = async (req, res, next) => {
    try {
        const tokenBucket = await getUserTokenBucket(req.ip)

        const currentTimeStamp = Date.now()
        const elapsedTime = currentTimeStamp - tokenBucket.last
        tokenBucket.tokens += elapsedTime * (rateLimitMaxRequests / rateLimitWindowMS)
        tokenBucket.tokens = Math.min(
            tokenBucket.tokens,
            rateLimitMaxRequests
        )
        tokenBucket.last = currentTimeStamp
        if (tokenBucket.tokens >= 1) {
            tokenBucket.tokens -= 1
            await saveUserTokenBucket(req.ip, tokenBucket)
            next()
        } else {
            res.status(429).send({
                error: 'Too many request per minute.    Please wait a bit...'
            })
        }
    } catch (err) {
        next()
    }
}
