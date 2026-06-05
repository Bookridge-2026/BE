const express = require("express");
const router = express.Router();

router.use("/health", require("./health"));
router.use("/oauth2", require("./oauth2"));
router.use("/books", require("./book"));
router.use("/rooms", require("./room"));
router.use("/invite", require("./invite"));
router.use("/friends", require("./friendRoute"));
router.use("/users", require("./userRoute"));
router.use("/blocks", require("./blockRoute"));
router.use("/ocr", require("./ocrRoute"))
router.use("/notifications", require("./notification"))

module.exports = router;
