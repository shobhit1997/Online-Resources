const express = require("express");
const AWS = require("aws-sdk");
const uuid = require("uuid/v1");
const authenticate = require(".././middleware/authenticate");
const router = express.Router();
const S3 = new AWS.S3({
	accessKeyId: process.env.AWS_CLIENT_ID,
	secretAccessKey: process.env.AWS_CLIENT_SECRET
});
router.route("/image").get(authenticate, async function(req, res) {
	if (!req.query.key) {
		key = `${req.user._id}/${uuid()}.jpeg`;
	} else {
		key = req.query.key;
	}
	S3.getSignedUrl(
		"putObject",
		{
			Bucket: "online-resources-images",
			ContentType: "image/*",
			Key: key
		},
		(err, url) => {
			res.send({ key, url });
		}
	);
});

router.route("/file").get(authenticate, async function(req, res) {
	let key;
	if (!req.query.key) {
		const type = req.query.type;
		key = `${req.user._id}/${uuid()}.${type}`;
	} else {
		console.log(req.query.key);
		key = req.query.key;
	}
	S3.getSignedUrl(
		"putObject",
		{
			Bucket: "online-resources-files",
			ContentType: "application/*",
			Key: key
		},
		(err, url) => {
			res.send({ key, url });
		}
	);
});

module.exports = router;
