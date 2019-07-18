const mongoose=require('mongoose');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const config=require('../../server/config/config');
var Schema=mongoose.Schema;

var UserSchema = new Schema({
	name : {
		type : String,
		required:true,
		minlength : 1,
		trim : true
	},
	email : {
		type: String
	},
	authType:{
		type:String,
		required:true,
		enum: ['infoconnect', 'google']
	},
	admission_no:{
		type:String
	},
	admin:{
		type:Boolean
	},
	createdAt: { type: Date, default: Date.now },
	tokens : [{
		access : {
			type : String,
			required : true
		},
		token: {
			type : String,
			required : true
		}
	}]
});

UserSchema.methods.generateAuthToken=function(){
	var user=this;
	var access='auth';
	var token = jwt.sign({_id:user._id.toHexString(),access},process.env.JWT_SECRET).toString();
	user.tokens.push({access,token});
	return user.save().then(function(){
		return token;
	});
};



UserSchema.statics.findByToken = function(token){
	var User =this;
	var decoded;

	try{

		decoded= jwt.verify(token,process.env.JWT_SECRET);

	}catch(e){

		return new Promise(function(resolve,reject){
			reject();
		});

	}
	// console.log(decoded);
	return User.findOne({
		_id : decoded._id,
		'tokens.token' : token,
		'tokens.access' : 'auth'
	});
};

module.exports=mongoose.model('User',UserSchema);

