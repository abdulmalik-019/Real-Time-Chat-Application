import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

// ==========================================
// BACKEND URL
// PC + MOBILE dono ke liye same IP
// ==========================================
const BACKEND_URL = "http://10.250.66.177:5000";

const socket = io(BACKEND_URL, {
    transports: ["websocket", "polling"],
});

function Chat({ user, onLogout }) {

    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [search, setSearch] = useState("");
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [editingMessageId, setEditingMessageId] =
        useState(null);

    const [editingText, setEditingText] =
        useState("");

    const [typingUser, setTypingUser] =
        useState(null);

    const typingTimeout =
        useRef(null);

    const [onlineUsers, setOnlineUsers] =
        useState({});

    // Selected user reference
    const selectedUserRef =
        useRef(null);


    // ==========================================
    // FETCH USERS
    // ==========================================
    useEffect(() => {

        const fetchUsers = async () => {

            try {

                const response = await fetch(
                    `${BACKEND_URL}/api/users`
                );

                const data =
                    await response.json();

                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Failed to fetch users"
                    );
                }

                const otherUsers =
                    data.filter(
                        (item) =>
                            String(item._id) !==
                            String(user.id)
                    );

                setUsers(otherUsers);

            } catch (error) {

                console.error(
                    "Users fetch error:",
                    error
                );

                setError(error.message);

            } finally {

                setLoading(false);
            }
        };

        fetchUsers();

    }, [user.id]);


    // ==========================================
    // SOCKET EVENTS
    // ==========================================
    useEffect(() => {

        // ------------------------------------------
        // PHONE/BROWSER BACK BUTTON
        // ------------------------------------------
        const handleBackButton = () => {

            if (
                window.innerWidth < 768 &&
                selectedUserRef.current
            ) {

                setSelectedUser(null);

                selectedUserRef.current = null;

                setMessages([]);

                setTypingUser(null);
            }
        };


        window.addEventListener(
            "popstate",
            handleBackButton
        );


        // ------------------------------------------
        // RECEIVE MESSAGE
        // ------------------------------------------
        const handleReceiveMessage = (
            receivedMessage
        ) => {

            console.log(
                "MESSAGE RECEIVED:",
                receivedMessage
            );

            setMessages(
                (previousMessages) => {

                    // Duplicate message avoid
                    const alreadyExists =
                        previousMessages.some(
                            (msg) =>
                                String(msg._id) ===
                                String(
                                    receivedMessage._id
                                )
                        );

                    if (alreadyExists) {

                        return previousMessages;
                    }

                    return [
                        ...previousMessages,
                        receivedMessage
                    ];
                }
            );
        };


        // ------------------------------------------
        // MESSAGE EDITED
        // ------------------------------------------
        const handleMessageEdited = (
            updatedMessage
        ) => {

            setMessages(
                (previousMessages) =>
                    previousMessages.map(
                        (msg) =>
                            String(msg._id) ===
                            String(
                                updatedMessage._id
                            )
                                ? {
                                      ...msg,
                                      text:
                                          updatedMessage.text
                                  }
                                : msg
                    )
            );
        };


        // ------------------------------------------
        // MESSAGE DELETED
        // ------------------------------------------
        const handleMessageDeleted = (
            messageId
        ) => {

            setMessages(
                (previousMessages) =>
                    previousMessages.filter(
                        (msg) =>
                            String(msg._id) !==
                            String(messageId)
                    )
            );
        };


        // ------------------------------------------
        // ONLINE / OFFLINE
        // ------------------------------------------
        const handleUserStatus = (data) => {

            console.log(
                "USER STATUS:",
                data
            );

            setOnlineUsers(
                (previousUsers) => ({
                    ...previousUsers,

                    [data.userId]:
                        data.online
                })
            );
        };


        // ------------------------------------------
        // USER TYPING
        // ------------------------------------------
        const handleUserTyping = (data) => {

            console.log(
                "USER TYPING:",
                data
            );

            // Apna typing status mat dikhao
            if (
                String(data.userId) ===
                String(user.id)
            ) {

                return;
            }

            setTypingUser(
                data.username
            );
        };


        // ------------------------------------------
        // USER STOP TYPING
        // ------------------------------------------
        const handleUserStopTyping = (data) => {

            if (
                !data ||
                String(data.userId) !==
                    String(user.id)
            ) {

                setTypingUser(null);
            }
        };


        // ------------------------------------------
        // SOCKET LISTENERS
        // ------------------------------------------

        socket.on(
            "receiveMessage",
            handleReceiveMessage
        );

        socket.on(
            "messageEdited",
            handleMessageEdited
        );

        socket.on(
            "messageDeleted",
            handleMessageDeleted
        );

        socket.on(
            "userStatus",
            handleUserStatus
        );

        socket.on(
            "userTyping",
            handleUserTyping
        );

        socket.on(
            "userStopTyping",
            handleUserStopTyping
        );


        // ------------------------------------------
        // CURRENT USER ONLINE
        // ------------------------------------------
        socket.emit(
            "userOnline",
            user.id
        );


        // ------------------------------------------
        // CLEANUP
        // ------------------------------------------
        return () => {

            window.removeEventListener(
                "popstate",
                handleBackButton
            );

            socket.off(
                "receiveMessage",
                handleReceiveMessage
            );

            socket.off(
                "messageEdited",
                handleMessageEdited
            );

            socket.off(
                "messageDeleted",
                handleMessageDeleted
            );

            socket.off(
                "userStatus",
                handleUserStatus
            );

            socket.off(
                "userTyping",
                handleUserTyping
            );

            socket.off(
                "userStopTyping",
                handleUserStopTyping
            );

            clearTimeout(
                typingTimeout.current
            );
        };

    }, [user.id]);


    // ==========================================
    // SELECT USER
    // ==========================================
    const handleSelectUser = async (
        chatUser
    ) => {

        setSelectedUser(chatUser);

        selectedUserRef.current =
            chatUser;

        setMessages([]);

        setTypingUser(null);


        // Mobile history
        if (
            window.innerWidth < 768
        ) {

            window.history.pushState(
                { chat: true },
                "",
                window.location.href
            );
        }


         if (
            window.innerWidth < 768
        ) {

            window.history.pushState(
                { chat: true },
                "",
                window.location.href
            );
        }


        try {

            const response =
                await fetch(
                    `${BACKEND_URL}/api/messages/${user.id}/${chatUser._id}`
                );

            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Failed to load messages"
                );
            }


            setMessages(data);

        } catch (error) {

            console.error(
                "Chat history error:",
                error
            );

            setMessages([]);
        }
    };


    // ==========================================
    // BACK TO USERS
    // ==========================================
    const handleBackToUsers = () => {

        setSelectedUser(null);

        selectedUserRef.current =
            null;

        setMessages([]);

        setTypingUser(null);

        clearTimeout(
            typingTimeout.current
        );


        // Mobile history back
        if (
            window.innerWidth < 768 &&
            window.history.state?.chat
        ) {

            window.history.back();
        }
    };


    // ==========================================
    // SEND MESSAGE
    // ==========================================
    const handleSendMessage = () => {

        if (
            !message.trim() ||
            !selectedUser
        ) {

            return;
        }


        const newMessage = {

            senderId: user.id,

            senderName:
                user.username,

            receiverId:
                selectedUser._id,

            receiverName:
                selectedUser.username,

            text:
                message.trim(),

            time:
                new Date().toLocaleTimeString(
                    [],
                    {
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                )
        };


        socket.emit(
            "sendMessage",
            newMessage
        );


        setMessage("");


        // Stop typing
        clearTimeout(
            typingTimeout.current
        );

        socket.emit(
            "stopTyping",
            {
                userId: user.id,
                username:
                    user.username
            }
        );
    };


    // ==========================================
    // EDIT MESSAGE
    // ==========================================
    const handleEditMessage = (
        messageId
    ) => {

        if (
            !editingText.trim()
        ) {

            return;
        }


        socket.emit(
            "editMessage",
            {
                messageId,
                text:
                    editingText.trim()
            }
        );


        setEditingMessageId(
            null
        );

        setEditingText("");
    };


    // ==========================================
    // DELETE MESSAGE
    // ==========================================
    const handleDeleteMessage = (
        messageId
    ) => {

        socket.emit(
            "deleteMessage",
            messageId
        );
    };


    // ==========================================
    // ENTER KEY
    // ==========================================
    const handleKeyDown = (e) => {

        if (
            e.key === "Enter" &&
            !e.shiftKey
        ) {

            e.preventDefault();

            handleSendMessage();
        }
    };


    // ==========================================
    // LOGOUT
    // ==========================================
    const handleLogout = () => {

        clearTimeout(
            typingTimeout.current
        );


        socket.emit(
            "stopTyping",
            {
                userId: user.id,
                username:
                    user.username
            }
        );


        socket.emit(
            "userOffline",
            user.id
        );


        onLogout();
    };


    // ==========================================
    // FILTER USERS
    // ==========================================
    const filteredUsers =
        users.filter(
            (item) =>
                item.username
                    .toLowerCase()
                    .includes(
                        search.toLowerCase()
                    )
        );


    // ==========================================
    // JSX
    // ==========================================
    return (

        <div className="h-screen bg-gray-100 flex">


            {/* ==================================
                SIDEBAR
            ================================== */}
            <div
                className={`
                    bg-white
                    border-r
                    border-gray-200
                    flex
                    flex-col

                    ${
                        selectedUser
                            ? "hidden md:flex md:w-[350px]"
                            : "w-full md:w-[350px]"
                    }
                `}
            >


                {/* HEADER */}
                <div
                    className="
                        bg-green-600
                        text-white
                        p-4
                        flex
                        items-center
                        justify-between
                    "
                >

                    <div
                        className="
                            flex
                            items-center
                            gap-3
                        "
                    >

                        {/* PROFILE */}
                        <div
                            className="
                                w-11
                                h-11
                                rounded-full
                                bg-white
                                text-green-600
                                flex
                                items-center
                                justify-center
                                font-bold
                                text-lg
                            "
                        >

                            {user.username
                                .charAt(0)
                                .toUpperCase()}

                        </div>


                        <div>

                            <h2
                                className="
                                    font-semibold
                                "
                            >
                                {user.username}
                            </h2>


                            {/* CURRENT USER ALWAYS ONLINE */}
                            <div
                                className="
                                    flex
                                    items-center
                                    gap-1
                                "
                            >

                                <span
                                    className="
                                        w-2
                                        h-2
                                        bg-green-300
                                        rounded-full
                                    "
                                ></span>

                                <p
                                    className="
                                        text-xs
                                        text-green-100
                                    "
                                >
                                    Online
                                </p>

                            </div>

                        </div>

                    </div>


                    {/* LOGOUT */}
                    <button
                        onClick={
                            handleLogout
                        }
                        className="
                            bg-red-500
                            hover:bg-red-600
                            px-3
                            py-2
                            rounded-lg
                            text-sm
                        "
                    >
                        Logout
                    </button>

                </div>


                {/* SEARCH */}
                <div
                    className="
                        p-3
                        bg-gray-50
                    "
                >

                    <input
                        type="text"
                        value={search}
                        onChange={(e) =>
                            setSearch(
                                e.target.value
                            )
                        }
                        placeholder="🔍 Search users"
                        className="
                            w-full
                            px-4
                            py-3
                            rounded-lg
                            border
                            border-gray-200
                            outline-none
                            focus:ring-2
                            focus:ring-green-500
                        "
                    />

                </div>


                {/* USERS */}
                <div
                    className="
                        flex-1
                        overflow-y-auto
                    "
                >

                    {loading && (

                        <p
                            className="
                                text-center
                                text-gray-400
                                mt-10
                            "
                        >
                            Loading users...
                        </p>
                    )}


                    {error && (

                        <p
                            className="
                                text-center
                                text-red-500
                                mt-10
                                px-4
                            "
                        >
                            {error}
                        </p>
                    )}


                    {!loading &&
                        !error &&
                        filteredUsers.map(
                            (chatUser) => (

                                <button
                                    key={
                                        chatUser._id
                                    }
                                    onClick={() =>
                                        handleSelectUser(
                                            chatUser
                                        )
                                    }
                                    className={`
                                        w-full
                                        flex
                                        items-center
                                        gap-3
                                        p-4
                                        text-left
                                        border-b
                                        border-gray-100
                                        hover:bg-gray-50

                                        ${
                                            selectedUser?._id ===
                                            chatUser._id
                                                ? "bg-gray-100"
                                                : ""
                                        }
                                    `}
                                >

                                    {/* PROFILE */}
                                    <div
                                        className="
                                            relative
                                        "
                                    >

                                        <div
                                            className="
                                                w-12
                                                h-12
                                                rounded-full
                                                bg-green-500
                                                text-white
                                                flex
                                                items-center
                                                justify-center
                                                font-bold
                                                text-lg
                                            "
                                        >

                                            {chatUser.username
                                                .charAt(0)
                                                .toUpperCase()}

                                        </div>


                                        {/* ONLINE DOT */}
                                        <span
                                            className={`
                                                absolute
                                                bottom-0
                                                right-0
                                                w-3
                                                h-3
                                                border-2
                                                border-white
                                                rounded-full

                                                ${
                                                    onlineUsers[
                                                        chatUser._id
                                                    ]
                                                        ? "bg-green-500"
                                                        : "bg-gray-400"
                                                }
                                            `}
                                        ></span>

                                    </div>


                                    {/* USER INFO */}
                                    <div
                                        className="
                                            flex-1
                                        "
                                    >

                                        <h3
                                            className="
                                                font-semibold
                                                text-gray-800
                                            "
                                        >
                                            {
                                                chatUser.username
                                            }
                                        </h3>


                                        <p
                                            className="
                                                text-sm
                                                text-gray-500
                                            "
                                        >
                                            {
                                                chatUser.email
                                            }
                                        </p>

                                    </div>

                                </button>
                            )
                        )}

                </div>

            </div>


            {/* ==================================
                CHAT AREA
            ================================== */}
            <div
                className={`
                    flex-1
                    flex-col

                    ${
                        selectedUser
                            ? "flex w-full"
                            : "hidden md:flex"
                    }
                `}
            >


                {!selectedUser ? (

                    /* EMPTY SCREEN */
                    <div
                        className="
                            flex-1
                            flex
                            items-center
                            justify-center
                            bg-gray-100
                        "
                    >

                        <div
                            className="
                                text-center
                            "
                        >

                            <div
                                className="
                                    text-7xl
                                    mb-5
                                "
                            >
                                💬
                            </div>


                            <h1
                                className="
                                    text-3xl
                                    font-semibold
                                    text-gray-700
                                "
                            >
                                Real-Time Chat
                            </h1>


                            <p
                                className="
                                    text-gray-500
                                    mt-2
                                "
                            >
                                Select a user to start chatting
                            </p>

                        </div>

                    </div>

                ) : (

                    <>
                        {/* ==========================
                            CHAT HEADER
                        ========================== */}
                        <div
                            className="
                                bg-green-600
                                text-white
                                p-4
                                flex
                                items-center
                                gap-3
                            "
                        >

                            {/* MOBILE BACK */}
                            <button
                                onClick={
                                    handleBackToUsers
                                }
                                className="
                                    md:hidden
                                    text-white
                                    text-3xl
                                    font-bold
                                    mr-1
                                    w-8
                                "
                            >
                                ←
                            </button>


                            {/* PROFILE */}
                            <div
                                className="
                                    w-11
                                    h-11
                                    rounded-full
                                    bg-white
                                    text-green-600
                                    flex
                                    items-center
                                    justify-center
                                    font-bold
                                "
                            >

                                {selectedUser.username
                                    .charAt(0)
                                    .toUpperCase()}

                            </div>


                            {/* USER INFO */}
                            <div>

                                <h2
                                    className="
                                        font-semibold
                                    "
                                >
                                    {
                                        selectedUser.username
                                    }
                                </h2>


                                <div
                                    className="
                                        flex
                                        items-center
                                        gap-1
                                    "
                                >

                                    <span
                                        className={`
                                            w-2
                                            h-2
                                            rounded-full

                                            ${
                                                onlineUsers[
                                                    selectedUser._id
                                                ]
                                                    ? "bg-green-300"
                                                    : "bg-gray-300"
                                            }
                                        `}
                                    ></span>


                                    <p
                                        className="
                                            text-xs
                                            text-green-100
                                        "
                                    >

                                        {
                                            onlineUsers[
                                                selectedUser._id
                                            ]
                                                ? "Online"
                                                : "Offline"
                                        }

                                    </p>

                                </div>

                            </div>

                        </div>


                        {/* ==========================
                            MESSAGES
                        ========================== */}
                        <div
                            className="
                                flex-1
                                overflow-y-auto
                                p-5
                                space-y-3
                            "
                        >

                            {messages.map(
                                (msg, index) => (

                                    <div
                                        key={
                                            msg._id ||
                                            index
                                        }
                                        className={`
                                            flex

                                            ${
                                                String(
                                                    msg.senderId
                                                ) ===
                                                String(
                                                    user.id
                                                )
                                                    ? "justify-end"
                                                    : "justify-start"
                                            }
                                        `}
                                    >

                                        <div
                                            className={`
                                                max-w-[70%]
                                                px-4
                                                py-2
                                                rounded-lg

                                                ${
                                                    String(
                                                        msg.senderId
                                                    ) ===
                                                    String(
                                                        user.id
                                                    )
                                                        ? "bg-green-500 text-white"
                                                        : "bg-white text-gray-800"
                                                }
                                            `}
                                        >

                                            {/* EDIT MODE */}
                                            {editingMessageId ===
                                            msg._id ? (

                                                <div
                                                    className="
                                                        flex
                                                        gap-2
                                                    "
                                                >

                                                    <input
                                                        value={
                                                            editingText
                                                        }
                                                        onChange={(
                                                            e
                                                        ) =>
                                                            setEditingText(
                                                                e.target
                                                                    .value
                                                            )
                                                        }
                                                        className="
                                                            text-black
                                                            px-2
                                                            py-1
                                                            rounded
                                                            outline-none
                                                        "
                                                        autoFocus
                                                    />


                                                    <button
                                                        onClick={() =>
                                                            handleEditMessage(
                                                                msg._id
                                                            )
                                                        }
                                                        className="
                                                            bg-white
                                                            text-green-600
                                                            px-2
                                                            py-1
                                                            rounded
                                                        "
                                                    >
                                                        Save
                                                    </button>


                                                    <button
                                                        onClick={() => {

                                                            setEditingMessageId(
                                                                null
                                                            );

                                                            setEditingText(
                                                                ""
                                                            );
                                                        }}
                                                        className="
                                                            bg-white
                                                            text-red-500
                                                            px-2
                                                            py-1
                                                            rounded
                                                        "
                                                    >
                                                        Cancel
                                                    </button>

                                                </div>

                                            ) : (

                                                <>
                                                    {/* MESSAGE */}
                                                    <p>
                                                        {
                                                            msg.text
                                                        }
                                                    </p>


                                                    {/* TIME + ACTIONS */}
                                                    <div
                                                        className="
                                                            flex
                                                            items-center
                                                            justify-end
                                                            gap-2
                                                            mt-1
                                                        "
                                                    >

                                                        <p
                                                            className="
                                                                text-xs
                                                                opacity-70
                                                            "
                                                        >
                                                            {
                                                                msg.time
                                                            }
                                                        </p>


                                                        {/* EDIT DELETE */}
                                                        {String(
                                                            msg.senderId
                                                        ) ===
                                                            String(
                                                                user.id
                                                            ) && (

                                                            <>

                                                                <button
                                                                    onClick={() => {

                                                                        setEditingMessageId(
                                                                            msg._id
                                                                        );

                                                                        setEditingText(
                                                                            msg.text
                                                                        );
                                                                    }}
                                                                    className="
                                                                        text-xs
                                                                        opacity-70
                                                                        hover:opacity-100
                                                                    "
                                                                >
                                                                    ✏️
                                                                </button>


                                                                <button
                                                                    onClick={() =>
                                                                        handleDeleteMessage(
                                                                            msg._id
                                                                        )
                                                                    }
                                                                    className="
                                                                        text-xs
                                                                        opacity-70
                                                                        hover:opacity-100
                                                                    "
                                                                >
                                                                    🗑️
                                                                </button>

                                                            </>
                                                        )}

                                                    </div>

                                                </>
                                            )}

                                        </div>

                                    </div>
                                )
                            )}

                        </div>


                        {/* ==========================
                            TYPING
                        ========================== */}
                        {typingUser && (

                            <div
                                className="
                                    text-sm
                                    text-gray-500
                                    px-4
                                    py-1
                                "
                            >
                                {typingUser} is typing...
                            </div>
                        )}


                        {/* ==========================
                            MESSAGE INPUT
                        ========================== */}
                        <div
                            className="
                                bg-white
                                border-t
                                p-3
                            "
                        >

                            <div
                                className="
                                    flex
                                    items-center
                                    gap-2
                                "
                            >

                                <input
                                    type="text"
                                    value={message}
                                    onChange={(e) => {

                                        const value =
                                            e.target.value;

                                        setMessage(
                                            value
                                        );


                                        clearTimeout(
                                            typingTimeout.current
                                        );


                                        if (
                                            value.trim()
                                        ) {

                                            socket.emit(
                                                "typing",
                                                {
                                                    userId:
                                                        user.id,

                                                    username:
                                                        user.username
                                                }
                                            );


                                            typingTimeout.current =
                                                setTimeout(
                                                    () => {

                                                        socket.emit(
                                                            "stopTyping",
                                                            {
                                                                userId:
                                                                    user.id,

                                                                username:
                                                                    user.username
                                                            }
                                                        );

                                                    },
                                                    1500
                                                );

                                        } else {

                                            socket.emit(
                                                "stopTyping",
                                                {
                                                    userId:
                                                        user.id,

                                                    username:
                                                        user.username
                                                }
                                            );
                                        }

                                    }}
                                    onKeyDown={
                                        handleKeyDown
                                    }
                                    placeholder="Type a message"
                                    className="
                                        flex-1
                                        bg-gray-100
                                        rounded-full
                                        px-5
                                        py-3
                                        outline-none
                                    "
                                />


                                <button
                                    onClick={
                                        handleSendMessage
                                    }
                                    className="
                                        w-11
                                        h-11
                                        rounded-full
                                        bg-green-600
                                        hover:bg-green-700
                                        text-white
                                        flex
                                        items-center
                                        justify-center
                                    "
                                >
                                    ➤
                                </button>

                            </div>

                        </div>

                    </>
                )}

            </div>

        </div>
    );
}

export default Chat;