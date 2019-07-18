const express=require('express');
const User= require('../.././app/models/user');
const Resource= require('../.././app/models/resource');
const authenticate=require('.././middleware/authenticate');
const router=express.Router();
router.route('/:id')
	.get(authenticate,async function(req,res){
		if(!req.user.admin){
			res.status(401).send({message:"Not a admin"});
		}
		else{
			if(req.params.id){
				var resource=await Resource.findById(req.params.id);
				res.send(resource);
			}
			else{
				let verified=req.query.verified;
				var resources=await Resource.find({verified});
				res.send(resources);
			}
		}
	})
	.patch(authenticate,async function(req,res){
		if(req.user.admin){
			try{
				req.body.verified=0;
				var resource=await Resource.findOneAndUpdate({_id:req.params.id},req.body);
				if(resource){
					resource=await Resource.findOne({_id:req.body._id});
					resource.save();
					res.send(resource);
				}
				else{
					res.status(400).send({message:'Invalid Resource Id'});
				}
			}
			catch(e){
				res.status(400).send();
			}
		}
		else{
			res.status(401).send({message:'Not a admin'});
		}
	})
	.delete(authenticate,async function(req,res){
		if(req.user.admin){
			try{
				var resource=await Resource.findOne({_id:req.params.id});
				if(resource){
					if(resource.type=='file')
					{
						var params = {
						  Bucket: "online-resources-files", 
						  Key: resource.link.substring(resource.link.indexOf(resource.uploadedBy))
						 };
						 s3.deleteObject(params, function(err, data) {
						   if (err) console.log(err, err.stack); // an error occurred
						   else     console.log(data);           // successful response
						 });
					}
					if(resource.image.indexOf(resource.uploadedBy)>=0){
						var params = {
						  Bucket: "online-resources-images", 
						  Key: resource.image.substring(resource.image.indexOf(resource.uploadedBy))
						 };
						 s3.deleteObject(params, function(err, data) {
						   if (err) console.log(err, err.stack); // an error occurred
						   else     console.log(data);           // successful response
						 });	
					}
					resource.remove(function(err) {
					if (err) throw err;
					/* Document unindexing in the background */
					resource.on('es-removed', function(err, res1) {
						if (err) console.log(err);
						/* Docuemnt is unindexed */
						res.send({message:'deleted'});
						});
					});
				}
				else{
					res.status(400).send({message:'Invalid resource Id'});
				}
			}
			catch(e){
				res.status(400).send();
			}
		}
		else{
			res.status(401).send({message:'Not a admin'});
		}
	});

module.exports=router;