const express=require('express');
const User= require('../.././app/models/user');
const Resource= require('../.././app/models/resource');
const authenticate=require('.././middleware/authenticate');
const _ = require('lodash');
const router=express.Router();
router.route('/')
	.post(authenticate,async function(req,res){
		var resource=new Resource(req.body);
		resource.uploadedBy=req.user._id;
		if(!resource.image){
			resource.image="https://online-resources-images.s3.amazonaws.com/";
			if(resource.domain=='design'){
				resource.image+='design.jpeg'
			}
			else if(resource.domain=='coding'){
				resource.image+='coding.jpeg'
			}
			else if(resource.domain=='web'){
				resource.image+='web.jpeg'
			}
			else if(resource.domain=='devops'){
				resource.image+='devops.jpeg'
			}
		}
		else{
			resource.image="https://online-resources-images.s3.amazonaws.com/"+resource.image;
		}
		if(resource.type=='file'){
			resource.link="https://online-resources-files.s3.amazonaws.com/"+resource.link;	
		}
		try{
			resource.save(function(err){
			if (err) throw err;
			/* Document indexation on going */
			resource.on('es-indexed', function(err, res1){
			if (err) throw err;
			/* Document is indexed */
			res.send(resource);
			});
			});
		}
		catch(e){
			console.log(e);
		}

	})
	.get(async function(req,res){
		var resources=await Resource.find();
		res.send(resources);
	})
	.put(authenticate,async function(req,res){
		try{
			req.body.verified=0;
			var resource=await Resource.findOneAndUpdate({_id:req.body._id,uploadedBy:req.user._id},req.body);
			if(resource){
				resource=await Resource.findOne({_id:req.body._id,uploadedBy:req.user._id});
				resource.save();
				res.send(resource);
			}
			else{
				res.status(401).send({message:'You are not authorised to update this resource'});
			}
		}
		catch(e){
			res.status(400).send();
		}
	})
	.delete(authenticate,async function(req,res){
		try{
			var resource=await Resource.findOne({_id:req.body._id,uploadedBy:req.user._id});
			if(resource){
				if(resource.type=='file')
				{
					var params = {
					  Bucket: "online-resources-files", 
					  Key: resource.link.substring(resource.link.indexOf(req.user._id))
					 };
					 s3.deleteObject(params, function(err, data) {
					   if (err) console.log(err, err.stack); // an error occurred
					   else     console.log(data);           // successful response
					 });
				}
				if(resource.image.indexOf(req.user._id)>=0){
					var params = {
					  Bucket: "online-resources-images", 
					  Key: resource.image.substring(resource.image.indexOf(req.user._id))
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
				res.status(401).send({message:'You are not authorised to delete this resource'});
			}
		}
		catch(e){
			res.status(400).send();
		}
	});

router.route('/search')
	.post(authenticate,async function(req,res){
		Resource.search(
			{query_string: {query: req.body.search}},
			function(err, results) {
			var data=results.hits.hits.map(function(hit){
				return hit._source;
			});
			res.send(data);
		});
	});

router.route('/my')
	.get(authenticate,async function(req,res){
		var resources=await Resource.find({uploadedBy:req.user._id});
		res.send(resources);
	});


module.exports=router;