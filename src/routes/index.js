const express = require("express");
const router = express.Router();

router.use("/health", require("./health"));
router.use("/oauth2", require("./oauth2"));
router.use("/books", require("./book"));
router.use("/rooms", require("./room"));
router.use("/invite", require("./invite"));
router.use("/friends", require("./friend"));
router.use("/users", require("./user"));
router.use("/blocks", require("./block"));

module.exports = router;
