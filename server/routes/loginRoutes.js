const express = require("express");
const User = require("../.././app/models/user");
const _ = require("lodash");
const request = require("request");
const googleUtils = require(".././googleUtils/googleUtils");
const Joi = require("joi");
const infoconnectUtils = require(".././infoconnectUtils/infoconnectUtils");
const router = express.Router();
router.route("/login/infoconnect").post(async function(req, res) {
	let code = req.body.code;
	try {
		var body = await infoconnectUtils.getUserDetails(code);
		var user = await User.findOne({ admission_no: body.username });
		if (user) {
			user.generateAuthToken()
				.then(function(token) {
					res.header("x-auth", token).send(user);
				})
				.catch(function(e) {
					res.status(400).send(e);
				});
		} else {
			user = new User({
				admission_no: body.username,
				name: body.name,
				authType: "infoconnect"
			});
			user.admin = false;
			user.save()
				.then(function() {
					return user.generateAuthToken();
				})
				.then(function(token) {
					res.header("x-auth", token).send(user);
				})
				.catch(function(e) {
					res.status(400).send(e);
				});
		}
	} catch (e) {
		console.log(e);
		res.send(e);
	}
});
router.route("/login/google").post(async function(req, res) {
	var data = await googleUtils.getGoogleAccountFromCode(
		decodeURIComponent(req.body.code)
	);
	try {
		var user = await User.findOne({ email: data.email });
		if (user) {
			user.generateAuthToken()
				.then(function(token) {
					res.header("x-auth", token).send(user);
				})
				.catch(function(e) {
					res.status(400).send(e);
				});
		} else {
			user = new User(data);
			user.admin = false;
			user.save()
				.then(function() {
					return user.generateAuthToken();
				})
				.then(function(token) {
					res.header("x-auth", token).send(user);
				})
				.catch(function(e) {
					res.status(400).send(e);
				});
		}
	} catch (e) {
		console.log(e);
	}
});

router.route("/login/googleurl").get(async function(req, res) {
	res.send(googleUtils.urlGoogle());
});

router.route("/login/infoconnecturl").get(async function(req, res) {
	let loginURL = await infoconnectUtils.getLoginUrl();
	res.send(loginURL);
});

module.exports = router;
