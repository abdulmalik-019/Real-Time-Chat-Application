const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const Message = require("./models/Message");

const app = express();


// ==========================================
// MIDDLEWARE
// ==========================================

app.use(
    cors({
        origin: true,
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    })
);

app.use(express.json());


// ==========================================
// API ROUTES
// ==========================================

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);


// ==========================================
// HTTP SERVER
// ==========================================

const server = http.createServer(app);


// ==========================================
// SOCKET.IO
// ==========================================

const io = new Server(server, {
    cors: {
        origin: true,
        methods: ["GET", "POST"],
        credentials: true
    }
});


// ==========================================
// ONLINE USERS
// ==========================================
//
// Map:
// userId -> Set of socket IDs
//
// Isse ek user PC + phone dono par login
// kar sakta hai.
//

const onlineUsers = new Map();


// ==========================================
// SOCKET CONNECTION
// ==========================================

io.on("connection", (socket) => {

    console.log(
        "Socket connected:",
        socket.id
    );


    // ======================================
    // USER ONLINE
    // ======================================

    socket.on("userOnline", (userId) => {

        if (!userId) {
            return;
        }

        const id = String(userId);

        socket.userId = id;


        // Agar user pehle se online hai
        if (!onlineUsers.has(id)) {

            onlineUsers.set(
                id,
                new Set()
            );
        }


        // Is device ka socket add karo
        onlineUsers
            .get(id)
            .add(socket.id);


        console.log(
            "User online:",
            id,
            "Socket:",
            socket.id
        );


        // ==================================
        // Naye user ko already-online users
        // ki list bhejo
        // ==================================

        onlineUsers.forEach(
            (socketIds, onlineUserId) => {

                if (
                    onlineUserId !== id &&
                    socketIds.size > 0
                ) {

                    socket.emit(
                        "userStatus",
                        {
                            userId:
                                onlineUserId,

                            online:
                                true
                        }
                    );
                }
            }
        );


        // ==================================
        // Sabhi users ko current user online
        // batao
        // ==================================

        io.emit(
            "userStatus",
            {
                userId: id,
                online: true
            }
        );
    });


    // ======================================
    // USER OFFLINE
    // ======================================

    socket.on("userOffline", (userId) => {

        if (!userId) {
            return;
        }

        const id = String(userId);

        removeSocket(
            id,
            socket.id
        );
    });


    // ======================================
    // SEND MESSAGE
    // ======================================

    socket.on(
        "sendMessage",
        async (message) => {

            try {

                console.log(
                    "Message received:",
                    message
                );


                if (
                    !message.senderId ||
                    !message.receiverId ||
                    !message.text ||
                    !message.text.trim()
                ) {

                    return;
                }


                // ==============================
                // SAVE MESSAGE IN MONGODB
                // ==============================

                const savedMessage =
                    await Message.create({

                        senderId:
                            message.senderId,

                        receiverId:
                            message.receiverId,

                        text:
                            message.text.trim()
                    });


                // ==============================
                // MESSAGE OBJECT
                // ==============================

                const messageToSend = {

                    _id:
                        savedMessage._id,

                    senderId:
                        String(
                            savedMessage.senderId
                        ),

                    receiverId:
                        String(
                            savedMessage.receiverId
                        ),

                    text:
                        savedMessage.text,

                    createdAt:
                        savedMessage.createdAt,

                    time:
                        new Date(
                            savedMessage.createdAt
                        ).toLocaleTimeString(
                            [],
                            {
                                hour:
                                    "2-digit",

                                minute:
                                    "2-digit"
                            }
                        )
                };


                // ==============================
                // SENDER KE SAARE DEVICES
                // ==============================

                sendToUser(
                    message.senderId,
                    "receiveMessage",
                    messageToSend
                );


                // ==============================
                // RECEIVER KE SAARE DEVICES
                // ==============================

                sendToUser(
                    message.receiverId,
                    "receiveMessage",
                    messageToSend
                );


                console.log(
                    "Message sent successfully"
                );

            } catch (error) {

                console.error(
                    "Message save error:",
                    error
                );
            }
        }
    );


    // ======================================
    // TYPING
    // ======================================

    socket.on(
        "typing",
        (data) => {

            if (!data?.userId) {
                return;
            }


            socket.broadcast.emit(
                "userTyping",
                {
                    userId:
                        String(
                            data.userId
                        ),

                    username:
                        data.username
                }
            );
        }
    );


    // ======================================
    // STOP TYPING
    // ======================================

    socket.on(
        "stopTyping",
        (data) => {

            if (!data?.userId) {
                return;
            }


            socket.broadcast.emit(
                "userStopTyping",
                {
                    userId:
                        String(
                            data.userId
                        ),

                    username:
                        data.username
                }
            );
        }
    );


    // ======================================
    // EDIT MESSAGE
    // ======================================

    socket.on(
        "editMessage",
        async ({
            messageId,
            text
        }) => {

            try {

                if (
                    !messageId ||
                    !text ||
                    !text.trim()
                ) {

                    return;
                }


                const updatedMessage =
                    await Message.findByIdAndUpdate(
                        messageId,
                        {
                            text:
                                text.trim()
                        },
                        {
                            new: true
                        }
                    );


                if (!updatedMessage) {
                    return;
                }


                const editedMessage = {

                    _id:
                        updatedMessage._id,

                    senderId:
                        String(
                            updatedMessage.senderId
                        ),

                    receiverId:
                        String(
                            updatedMessage.receiverId
                        ),

                    text:
                        updatedMessage.text,

                    createdAt:
                        updatedMessage.createdAt
                };


                // Sender ke devices
                sendToUser(
                    updatedMessage.senderId,
                    "messageEdited",
                    editedMessage
                );


                // Receiver ke devices
                sendToUser(
                    updatedMessage.receiverId,
                    "messageEdited",
                    editedMessage
                );


                console.log(
                    "Message edited:",
                    messageId
                );

            } catch (error) {

                console.error(
                    "Socket edit error:",
                    error
                );
            }
        }
    );


    // ======================================
    // DELETE MESSAGE
    // ======================================

    socket.on(
        "deleteMessage",
        async (messageId) => {

            try {

                if (!messageId) {
                    return;
                }


                const deletedMessage =
                    await Message.findByIdAndDelete(
                        messageId
                    );


                if (!deletedMessage) {
                    return;
                }


                // Sirf sender + receiver ke
                // devices par delete event bhejo

                sendToUser(
                    deletedMessage.senderId,
                    "messageDeleted",
                    String(messageId)
                );


                sendToUser(
                    deletedMessage.receiverId,
                    "messageDeleted",
                    String(messageId)
                );


                console.log(
                    "Message deleted:",
                    messageId
                );

            } catch (error) {

                console.error(
                    "Socket delete error:",
                    error
                );
            }
        }
    );


    // ======================================
    // DISCONNECT
    // ======================================

    socket.on(
        "disconnect",
        () => {

            console.log(
                "Socket disconnected:",
                socket.id
            );


            if (socket.userId) {

                removeSocket(
                    socket.userId,
                    socket.id
                );
            }
        }
    );
});


// ==========================================
// REMOVE SOCKET
// ==========================================

function removeSocket(
    userId,
    socketId
) {

    const id = String(userId);

    const socketIds =
        onlineUsers.get(id);


    if (!socketIds) {
        return;
    }


    socketIds.delete(
        socketId
    );


    // Agar user ke koi devices connected
    // nahi hain tabhi offline karo

    if (
        socketIds.size === 0
    ) {

        onlineUsers.delete(id);


        io.emit(
            "userStatus",
            {
                userId: id,
                online: false
            }
        );


        console.log(
            "User offline:",
            id
        );
    }
}


// ==========================================
// SEND EVENT TO ALL USER DEVICES
// ==========================================

function sendToUser(
    userId,
    event,
    data
) {

    const id = String(userId);

    const socketIds =
        onlineUsers.get(id);


    if (!socketIds) {
        return;
    }


    socketIds.forEach(
        (socketId) => {

            const userSocket =
                io.sockets.sockets.get(
                    socketId
                );


            if (userSocket) {

                userSocket.emit(
                    event,
                    data
                );
            }
        }
    );
}


// ==========================================
// TEST API
// ==========================================

app.get(
    "/",
    (req, res) => {

        res.json({
            message:
                "Real-Time Chat API is running"
        });
    }
);


// ==========================================
// MONGODB
// ==========================================

mongoose
    .connect(
        process.env.MONGODB_URI
    )
    .then(() => {

        console.log(
            "MongoDB connected"
        );


        const PORT =
            process.env.PORT || 5000;


        server.listen(
            PORT,
            "0.0.0.0",
            () => {

                console.log(
                    `Server running on http://0.0.0.0:${PORT}`
                );

                console.log(
                    `Network access: http://10.250.66.177:${PORT}`
                );
            }
        );

    })
    .catch(
        (error) => {

            console.error(
                "MongoDB connection failed:",
                error.message
            );
        }
    );