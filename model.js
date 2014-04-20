/**
 * Created by yusa on 14/04/17.
 */
var systemConfig = require('./config');
var mongoose = require('mongoose');

var config = systemConfig.Config;
var mongoOptions = {
    db: { safe: true },
    server: { auto_reconnect: true },
    replset: { read_secondary: true }
};

var uri = config.mongo.uri;
var db = mongoose.connect(uri, mongoOptions, function (err, res){
    if (err) {
        console.log ('ERROR connecting to: ' + uri + '. ' + err);
    } else {
        console.log ('Succeeded connected to: ' + uri);
    }
});

var PostSchema = new mongoose.Schema({
    name: { type: String },
    text: { type: String },
    date: { type: Date, default: Date.now }
});

var collection = config.mongo.collection;
exports.Post = db.model('Post', PostSchema, collection);
