const express = require('express');
const router = express.Router();

router.use('/health', require('./health'));
router.use('/oauth2', require('./oauth2'));

module.exports = router;