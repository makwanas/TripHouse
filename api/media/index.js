const router = require('express').Router();

router.use('/photos', require('./photos'))

module.exports = router;