const mongoose=require('mongoose');
const jwt = require('jsonwebtoken');
const mongoosastic = require('mongoosastic');
const config=require('../../server/config/config');
var Schema=mongoose.Schema;

var ResourceSchema = new Schema({
	link : {
		type : String,
		required:true,
	},
	description : {
		type: String,
		required:true
	},
	type:{
		type:String,
		required:true
	},
	uploadedBy:{
		type:Schema.ObjectId,
		required:true
	},
	uploadedAt: { type: Date, default: Date.now }
});

ResourceSchema.plugin(mongoosastic);


module.exports=mongoose.model('Resource',ResourceSchema);

