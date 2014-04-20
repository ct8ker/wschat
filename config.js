var config = {
    http : {
        port : 80,
        host : "localhost",
        context : "/chat/",
        socketPort : 3000, 
        socketUri : "ws://localhost/chat/ws/",
        user : "yusa"
    },
    timer : {
        mainRoutineInterval : 5000,
        dataFeedInterval : 5000
    },
    mongo : {
        uri : "mongodb://192.168.0.62/chat",
        collection : "posts"
    }
};

exports.Config = config;
