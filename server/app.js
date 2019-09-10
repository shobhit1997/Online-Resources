const path= require('path');
const publicPath = path.join(__dirname,'../public');
const express=require('express');
const  app=express();
const bodyParser=require('body-parser');
const loginRouter=require('./routes/loginRoutes');
const resourceRouter=require('./routes/resourceRoutes');
const uploadRouter=require('./routes/uploadRoutes');
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());
app.use(express.static(publicPath));
app.use(function(req,res,next){
	res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Expose-Headers', 'x-auth');
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
    res.setHeader('Access-Control-Allow-Headers','Origin, X-Requested-With,content-type, Accept , x-auth');
  
	next();
});
app.get("/", function(req, res) {
	// body...
	res.send({ message: "Welcome" });
});
app.use('/api/user',loginRouter);
app.use('/api/resource',resourceRouter);
app.use('/api/upload',uploadRouter);
module.exports=app;
