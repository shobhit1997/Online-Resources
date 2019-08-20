const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const mongoosastic = require("mongoosastic");
const config = require("../../server/config/config");
var Schema = mongoose.Schema;

var ResourceSchema = new Schema({
	link: {
		type: String,
		required: true
	},
	title: {
		type: String,
		required: true
	},
	description: {
		type: String,
		required: true
	},
	type: {
		type: String,
		required: true
	},
	uploadedBy: {
		type: Schema.ObjectId,
		required: true
	},
	verified: {
		type: Number,
		default: 0
	},
	upvotes: {
		userid: [Schema.ObjectId],
		count: Number
	},
	downvotes: {
		userid: [Schema.ObjectId],
		count: Number
	},
	domain: {
		type: String,
		required: true
	},
	views: {
		type: Number,
		default: 0
	},
	image: {
		type: String
	},
	uploadedAt: { type: Date, default: Date.now }
});

ResourceSchema.plugin(mongoosastic);

module.exports = mongoose.model("Resource", ResourceSchema);
