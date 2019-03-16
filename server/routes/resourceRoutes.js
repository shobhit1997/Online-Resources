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


module.exports=router;