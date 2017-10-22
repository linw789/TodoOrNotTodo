'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ItemSchema = new Schema({
    description: String,
    status: Number,
    priority: Number,
    startTime: Number,
    endTime: Number
});

module.exports = mongoose.model('Item', ItemSchema);