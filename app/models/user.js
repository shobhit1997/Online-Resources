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



// UserSchema.pre('save',function(next){
// var user = this;
// if(user.isModified('password'))
// {
// 	bcrypt.genSalt(10,function(err,salt){
// 		bcrypt.hash(user.password,salt,function(err,hash){
// 			user.password=hash;
// 			next();
// 		});
// 	});
// }
// else
// {
// 	next();
// }
// });



module.exports=mongoose.model('User',UserSchema);

