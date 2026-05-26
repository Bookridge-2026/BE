const express = require('express');
const router = express.Router();

router.use('/health', require('./health'));
router.use('/oauth2', require('./oauth2'));
router.use("/rooms", require("./room"));

module.exports = router;