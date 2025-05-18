require('dotenv').config();

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { TikTokConnectionWrapper, getGlobalConnectionCount } = require('./connectionWrapper');
const { clientBlocked } = require('./limiter');
const { WebcastEvent } = require('tiktok-live-connector');

const app = express();
const httpServer = createServer(app);

// Enable cross origin resource sharing
const io = new Server(httpServer, {
    cors: {
        origin: '*'
    }
});


io.on('connection', (socket) => {
    let tiktokConnectionWrapper;

    console.info('New connection from origin', socket.handshake.headers['origin'] || socket.handshake.headers['referer']);

    socket.on('setUniqueId', (uniqueId, options) => {

        // Prohibit the client from specifying these options (for security reasons)
        if (typeof options === 'object' && options) {
            delete options.requestOptions;
            delete options.websocketOptions;
        } else {
            options = {};
        }

        // Session ID in .env file is optional
        if (process.env.SESSIONID) {
            options.sessionId = process.env.SESSIONID;
            console.info('Using SessionId');
        }

        // Check if rate limit exceeded
        if (process.env.ENABLE_RATE_LIMIT && clientBlocked(io, socket)) {
            socket.emit('tiktokDisconnected', 'You have opened too many connections or made too many connection requests. Please reduce the number of connections/requests or host your own server instance. The connections are limited to avoid that the server IP gets blocked by TokTok.');
            return;
        }

        // Connect to the given username (uniqueId)
        try {
            tiktokConnectionWrapper = new TikTokConnectionWrapper(uniqueId, options, true);
            tiktokConnectionWrapper.connect();
        } catch (err) {
            socket.emit('tiktokDisconnected', err.toString());
            return;
        }

        // Redirect wrapper control events once
        tiktokConnectionWrapper.once('connected', state => socket.emit('tiktokConnected', state));
        tiktokConnectionWrapper.once('disconnected', reason => socket.emit('tiktokDisconnected', reason));

        // Notify client when stream ends
        tiktokConnectionWrapper.connection.on(WebcastEvent.STREAM_END, () => socket.emit(WebcastEvent.STREAM_END));

        // Redirect message events
        tiktokConnectionWrapper.connection.on(WebcastEvent.ROOM_USER, msg => socket.emit(WebcastEvent.ROOM_USER, msg));
        tiktokConnectionWrapper.connection.on(WebcastEvent.MEMBER, msg => socket.emit(WebcastEvent.MEMBER, msg));
        tiktokConnectionWrapper.connection.on(WebcastEvent.CHAT, msg => socket.emit(WebcastEvent.CHAT, msg));
        tiktokConnectionWrapper.connection.on(WebcastEvent.GIFT, msg => socket.emit(WebcastEvent.GIFT, msg));
        tiktokConnectionWrapper.connection.on(WebcastEvent.SOCIAL, msg => socket.emit(WebcastEvent.SOCIAL, msg));
        tiktokConnectionWrapper.connection.on(WebcastEvent.LIKE, msg => socket.emit(WebcastEvent.LIKE, msg));
        tiktokConnectionWrapper.connection.on(WebcastEvent.QUESTION_NEW, msg => socket.emit(WebcastEvent.QUESTION_NEW, msg));
        tiktokConnectionWrapper.connection.on(WebcastEvent.LINK_MIC_BATTLE, msg => socket.emit(WebcastEvent.LINK_MIC_BATTLE, msg));
        tiktokConnectionWrapper.connection.on(WebcastEvent.LINK_MIC_ARMIES, msg => socket.emit(WebcastEvent.LINK_MIC_ARMIES, msg));
        tiktokConnectionWrapper.connection.on(WebcastEvent.LIVE_INTRO, msg => socket.emit(WebcastEvent.LIVE_INTRO, msg));
        tiktokConnectionWrapper.connection.on(WebcastEvent.EMOTE, msg => socket.emit(WebcastEvent.EMOTE, msg));
        tiktokConnectionWrapper.connection.on(WebcastEvent.ENVELOPE, msg => socket.emit(WebcastEvent.ENVELOPE, msg));
        tiktokConnectionWrapper.connection.on(WebcastEvent.SUBSCRIBE, msg => socket.emit(WebcastEvent.SUBSCRIBE, msg));
        tiktokConnectionWrapper.connection.on(WebcastEvent.FOLLOW, msg => socket.emit(WebcastEvent.FOLLOW, msg));
        tiktokConnectionWrapper.connection.on(WebcastEvent.SHARE, msg => socket.emit(WebcastEvent.SHARE, msg));
    });

    socket.on('disconnect', () => {
        if (tiktokConnectionWrapper) {
            tiktokConnectionWrapper.disconnect();
        }
    });
});

// Emit global connection statistics
setInterval(() => {
    io.emit('statistic', { globalConnectionCount: getGlobalConnectionCount() });
}, 5000)

// Serve frontend files
app.use(express.static('public'));

// Start http listener
const port = process.env.PORT || 8081;
httpServer.listen(port);
console.info(`Server running! Please visit http://localhost:${port}`);