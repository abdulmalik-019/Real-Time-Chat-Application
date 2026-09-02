const express = require("express");
const User = require("../models/User");

const router = express.Router();

// GET ALL USERS
router.get("/", async (req, res) => {
    try {
        const users = await User.find()
            .select("_id username email");

        res.json(users);

    } catch (error) {
        console.error("Users fetch error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
});

module.exports = router;