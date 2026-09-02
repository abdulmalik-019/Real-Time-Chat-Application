const express = require("express");
const Message = require("../models/Message");

const router = express.Router();

// GET CHAT HISTORY
router.get("/:userId/:otherUserId", async (req, res) => {
    try {
        const { userId, otherUserId } = req.params;

        const messages = await Message.find({
            $or: [
                {
                    senderId: userId,
                    receiverId: otherUserId
                },
                {
                    senderId: otherUserId,
                    receiverId: userId
                }
            ]
        }).sort({ createdAt: 1 });

        res.json(messages);

    } catch (error) {
        console.error("Chat history error:", error);

        res.status(500).json({
            message: "Failed to load messages"
        });
    }
});
// EDIT MESSAGE
router.put("/:messageId", async (req, res) => {
    try {
        const { messageId } = req.params;
        const { text } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({
                message: "Message cannot be empty"
            });
        }

        const updatedMessage = await Message.findByIdAndUpdate(
            messageId,
            {
                text: text.trim()
            },
            {
                new: true
            }
        );

        if (!updatedMessage) {
            return res.status(404).json({
                message: "Message not found"
            });
        }

        res.json(updatedMessage);

    } catch (error) {
        console.error("Edit message error:", error);

        res.status(500).json({
            message: "Failed to edit message"
        });
    }
});


// DELETE MESSAGE
router.delete("/:messageId", async (req, res) => {
    try {
        const { messageId } = req.params;

        const deletedMessage = await Message.findByIdAndDelete(
            messageId
        );

        if (!deletedMessage) {
            return res.status(404).json({
                message: "Message not found"
            });
        }

        res.json({
            message: "Message deleted successfully",
            messageId
        });

    } catch (error) {
        console.error("Delete message error:", error);

        res.status(500).json({
            message: "Failed to delete message"
        });
    }
});

module.exports = router;