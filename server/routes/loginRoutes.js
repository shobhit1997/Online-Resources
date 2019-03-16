const express=require('express');
const User= require('../.././app/models/user');
const _ = require('lodash');
const request=require('request');
const googleUtils=require('.././googleUtils/googleUtils');
const Joi=require('joi');
const router=express.Router();
router.route('/login/infoconnect')
	.post(async function(req,res){
		console.log(googleUtils.urlGoogle());
		var values = {
	      username: `${req.body.username}`,
	      password: `${req.body.password}`
	    }
	    request.post(
	      'http://210.212.85.155/api/profiles/login/',
	      { json: true,
	        body: values },
	      async function (error, response, body) {
	      	if(!error && response.statusCode==200){
	      		try{
	      			var user=await User.findOne({admission_no:body.username})
	      			if(user){

	      				user.generateAuthToken().then(function(token){
							res.header('x-auth',token).send(user);
						}).catch(function(e){
							res.status(400).send(e);
						});

	      			}
	      			else{

	      				user=new User({admission_no:body.username,name:body.first_name,authType:'infoconnect'});
	      				user.save().then(function(){
							return user.generateAuthToken();
						}).then(function(token){
							res.header('x-auth',token).send(user);

						}).catch(function(e){
							res.status(400).send(e);
						});
	      			}
	      		}
	      		catch(e){
	      			console.log(e);
	      		}
	      	}
	      	else if(!error && response.statusCode==406){
	      		res.status(406).send({message:"Incorrect Credentials"});
	      	}
	      	else{
	      		res.status(400).send({message:"Bad Request"});
	      	}
	      }
	    );
	});
router.route('/login/google')
	.post(async function(req,res){
		var data=await googleUtils.getGoogleAccountFromCode(req.body.code);
		try{
  			var user=await User.findOne({email:data.email})
  			if(user){

  				user.generateAuthToken().then(function(token){
					res.header('x-auth',token).send(user);
				}).catch(function(e){
					res.status(400).send(e);
				});

  			}
  			else{

  				user=new User(data);
  				user.save().then(function(){
					return user.generateAuthToken();
				}).then(function(token){
					res.header('x-auth',token).send(user);

				}).catch(function(e){
					res.status(400).send(e);
				});
  			}
  		}
  		catch(e){
  			console.log(e);
	    }
	});


module.exports=router;