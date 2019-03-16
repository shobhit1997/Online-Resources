const Joi = require('joi');

const schema = Joi.object().keys({
    name: Joi.string().min(3).max(30).required(),
    authType:Joi.string().valid(['infoconnect','Female','Other']).required(),
    password:Joi.string().min(6).required(),
    dob:Joi.string().min(10).max(10).required(),
    email: Joi.string().email({ minDomainAtoms: 2 }).required()
});

module.exports=schema;