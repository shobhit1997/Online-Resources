const axios = require('axios');

async function getLoginUrl() {
  try {
    const response = await axios.get(`http://52.91.35.65:3000/oauth/loginURL?projectID=${process.env.INFOCONNECT_PROJECT_ID}&projectSecret=${process.env.INFOCONNECT_PROJECT_SECRET}`);
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error(error);
    return Promise.reject(error);
  }
}

async function getUserDetails(code){
	try{
		const response=await axios.get(`http://52.91.35.65:3000/oauth/userinfo?projectID=${process.env.INFOCONNECT_PROJECT_ID}&projectSecret=${process.env.INFOCONNECT_PROJECT_SECRET}&code=${code}`);
		console.log(response);
	    return response.data;
	  } catch (error) {
	    console.error(error);
	    return Promise.reject(error);
	  }
}

module.exports={getLoginUrl,getUserDetails};