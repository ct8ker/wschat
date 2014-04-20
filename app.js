var http = require("http");
var webSocket = require("websocket");
var url = require("url");
var ejs = require("ejs");
var uuid = require("node-uuid");
var validator = require("validator");
var Post = require('./model').Post;
var clientEjs = require("fs").readFileSync("client.ejs", "utf8");
var systemConfig = require("./config");

// Settings
var config = systemConfig.Config;

// Http Server
var plainHttpServer = http.createServer(function(req, res) {
    res.writeHead(200, { "Content-Type": "text/html"});
    res.end(ejs.render(clientEjs, {
        socketUri: config.http.socketUri
    }));
}).listen(config.http.socketPort, function() {
    process.setuid(config.http.user);
    console.log("listening on port " + config.http.socketPort);
});

// WebSocket Server
var webSocketServer = new webSocket.server({
    httpServer: plainHttpServer,
    autoAcceptConnections: false
});

var clients = {};

// WebSocket
webSocketServer.on("request", function (req) {
    req.origin = req.origin || "*";
    if (config.http.host.indexOf(url.parse(req.origin).hostname) === -1) {
        req.reject();
    }

    var connection = req.accept(null, req.origin);
    console.log(req.origin);

    connection.on("message", function(msg) {
        var data = JSON.parse(msg.utf8Data);
        var now = new Date();
        var post = new Post();
        post.name = data.name;
        post.text = data.text;
        post.date = now;
        post.save(function(err) {
            if (!err) {
                broadCast({
                    type: "post",
                    name: validator.escape(post.name ? post.name : "No Name"),
                    text: validator.escape(post.text).split("\n").join("<br>"),
                    date: post.date
                });
            }
        });
    });

    var connId = getConnId();

    connection.on("close", function (code, desc) {
        delete clients[connId];
        sendClientsCount();
        console.log("connection [" + connId + "] released! :" + code + " - " + desc);
    });

    clients[connId] = {connection: connection};
    Post.find(function(err, docs) {
        if (!err) {
            connection.send(JSON.stringify({
                type: "load",
                posts: docs
            }));
        }
    });
    sendClientsCount();
});

/**
 * 全クライアントへPUSH
 * @param data
 */
var broadCast = function(data) {
    for (var key in clients) {
        clients[key].connection.send(JSON.stringify(data));
    }
};

/**
 * コネクションID生成
 * @returns {*}
 */
var getConnId = function() {
    var connId = uuid.v4();
    while(clients[connId]) {
        connId = uuid.v4();
    }
    return connId;
};

/**
 * 接続数をPUSH
 */
var sendClientsCount = function() {
    var cnt = 0;
    for (var key in clients) {
        cnt++;
    }
    broadCast({
        type: "clients",
        count: cnt
    });
};
