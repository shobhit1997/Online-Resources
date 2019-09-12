const express = require("express");
const R = require('ramda');
const User = require("../.././app/models/user");
const Resource = require("../.././app/models/resource");
const authenticate = require(".././middleware/authenticate");
const _ = require("lodash");
const router = express.Router();
var elasticsearch = require("elasticsearch");
var client = new elasticsearch.Client({
    host: "localhost:9200",
    log: "trace"
});
router
    .route("/")
    .post(authenticate, async function(req, res) {
        var resource = new Resource(req.body);
        resource.uploadedBy = req.user._id;
        if (!resource.image) {
            resource.image =
                "https://online-resources-images.s3.amazonaws.com/";
            if (resource.domain == "design") {
                resource.image += "design.jpeg";
            } else if (resource.domain == "coding") {
                resource.image += "coding.jpeg";
            } else if (resource.domain == "web") {
                resource.image += "web.jpeg";
            } else if (resource.domain == "devops") {
                resource.image += "devops.jpeg";
            }
        } else {
            resource.image =
                "https://online-resources-images.s3.amazonaws.com/" +
                resource.image;
        }
        if (resource.type != "link") {
            resource.link =
                "https://online-resources-files.s3.amazonaws.com/" +
                resource.link;
        }
        resource.verified = req.user.admin ? 1 : 0;
        try {
            resource.save(function(err) {
                if (err) throw err;
                /* Document indexation on going */
                resource.on("es-indexed", function(err, res1) {
                    if (err) throw err;
                    /* Document is indexed */
                    res.send(resource);
                });
            });
        } catch (e) {
            console.log(e);
        }
    })
    .get(async function(req, res) {
        const domain = req.query.domain;
        let resources;
        if (domain) {
            resources = await Resource.aggregate([
                { $match: { domain, verified: 0 } },
                { $sort: { views: -1 } },
                { $group: { _id: "$type", posts: { $push: "$$ROOT" } } }
            ]);
        } else {
            resources = await Resource.aggregate([
                { $match: { verified: 0 } },
                { $sort: { views: -1 } },
                { $group: { _id: "$domain", posts: { $push: "$$ROOT" } } }
            ]);
        }

        res.send(R.indexBy(R.prop('_id'), resources));
    })
    .put(authenticate, async function(req, res) {
        try {
            req.body.verified = req.user.admin ? 1 : 0;
            if (req.body.link) {
                if (resource.type != "link") {
                    resource.link =
                        "https://online-resources-files.s3.amazonaws.com/" +
                        resource.link;
                }
            }
            var resource = await Resource.findOneAndUpdate({ _id: req.body._id, uploadedBy: req.user._id },
                req.body
            );
            if (resource) {
                resource = await Resource.findOne({
                    _id: req.body._id,
                    uploadedBy: req.user._id
                });
                await client.update({
                    index: "resources",
                    type: "resource",
                    id: req.body._id,
                    body: {
                        doc: req.body
                    }
                });
                res.send(resource);
            } else {
                res.status(401).send({
                    message: "You are not authorised to update this resource"
                });
            }
        } catch (e) {
            res.status(400).send();
        }
    })
    .delete(authenticate, async function(req, res) {
        try {
            var resource = await Resource.findOne({
                _id: req.body._id,
                uploadedBy: req.user._id
            });
            if (resource) {
                if (resource.type == "file") {
                    var params = {
                        Bucket: "online-resources-files",
                        Key: resource.link.substring(
                            resource.link.indexOf(req.user._id)
                        )
                    };
                    s3.deleteObject(params, function(err, data) {
                        if (err) console.log(err, err.stack);
                        // an error occurred
                        else console.log(data); // successful response
                    });
                }
                if (resource.image.indexOf(req.user._id) >= 0) {
                    var params = {
                        Bucket: "online-resources-images",
                        Key: resource.image.substring(
                            resource.image.indexOf(req.user._id)
                        )
                    };
                    s3.deleteObject(params, function(err, data) {
                        if (err) console.log(err, err.stack);
                        // an error occurred
                        else console.log(data); // successful response
                    });
                }
                resource.remove(function(err) {
                    if (err) throw err;
                    /* Document unindexing in the background */
                    resource.on("es-removed", function(err, res1) {
                        if (err) console.log(err);
                        /* Docuemnt is unindexed */
                        res.send({ message: "deleted" });
                    });
                });
            } else {
                res.status(401).send({
                    message: "You are not authorised to delete this resource"
                });
            }
        } catch (e) {
            res.status(400).send();
        }
    });

router.route("/search").get(async function(req, res) {
    const response = await client.search({
        index: "resources",
        type: "resource",
        body: {
            query: {
                bool: {
                    must: [{
                            match: {
                                verified: 0
                            }
                        },
                        {
                            query_string: {
                                query: req.query.search
                            }
                        }
                    ]
                }
            },
            aggs: {
                group_by_domain: {
                    terms: {
                        field: "domain"
                    },
                    aggs: {
                        buckets: {
                            top_hits: {}
                        }
                    }
                }
            },
            size: 0
        }
    });

    let json = response.aggregations.group_by_domain.buckets.map(bucket => {
        return {
            _id: bucket.key,
            posts: bucket.buckets.hits.hits.map(hit => hit._source)
        };
    });
    res.send(R.indexBy(R.prop('_id'), json));
});

router.route("/my").get(authenticate, async function(req, res) {
    var resources = await Resource.find({ uploadedBy: req.user._id });
    res.send(resources);
});

router.route("/viewed").get(async function(req, res) {
    const _id = req.query.id;
    try {
        var resource = await Resource.findOneAndUpdate({ _id }, {
            $inc: {
                views: 1
            }
        });
        if (resource) {
            await client.update({
                index: "resources",
                type: "resource",
                id: _id,
                body: {
                    "script": "ctx._source.views += params.count",
                    "params": {
                        "count": 1
                    }
                }
            });
            res.send({ message: "successful" });
        } else {
            res.send({ message: "unsuccessful" });
        }

    } catch (error) {
        console.log(error);
        res.send({ message: "unsuccessful" });
    }
});

module.exports = router;