const fs = require("fs");
const login = require("facebook-chat-api");
var config= require('./config');
var credentials = {email: config.facebookUsername , password: config.facebookPassword};

login(credentials, (err, api) => {
    if(err) return console.error(err);

    fs.writeFileSync('appstate.json', JSON.stringify(api.getAppState()));
});