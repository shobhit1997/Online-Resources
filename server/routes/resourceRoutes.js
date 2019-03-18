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