const router = require('express').Router()

router.use('/users', require('./users'))
router.use('/lodgings', require('./lodgings'))
router.use('/photos', require('./photos'))
router.use('/reviews', require('./reviews'))
router.use('/media', require('./media/index'))

module.exports = router
