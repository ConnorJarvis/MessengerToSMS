var config= require('./config');
var express = require('express');
var app = express()
const bodyParser = require('body-parser');
const fs = require("fs");
const login = require("facebook-chat-api");
const client = require('twilio')(config.twilioSid, config.twilioToken);

app.use(bodyParser.urlencoded({ extended: false }));

app.post('/webhook', function (req, res) {
    var body = req.body
    var message = req.body.Body
    if (req.body.AccountSid === config.twilioSid && req.body.From === config.fromNumber) {
        sendFacebookMessage(message)
    }
    
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end("<Response></Response>");
})

app.listen(8080)


function sendSMSMessage(body,from) {
    client.messages
        .create({
            body: from + ': ' + body,
            from: config.twilioNumber,
            to: config.fromNumber
        })
        .then(message => console.log(message.sid))
        .done();
}

function sendFacebookMessage(body) {
    global.api.sendMessage(config.relayingFor + ": " + body,config.threadID)
}


function facebookLogin() {

    return new Promise(function(resolve,reject){
        if (fs.existsSync('appstate.json')) {
            resolve(JSON.parse(fs.readFileSync('appstate.json', 'utf8')))
        } else {
            login({email: config.facebookUsername , password: config.facebookPassword}, (err, api) => {
                if(err) {
                    reject(err);
                } else {
                    fs.writeFileSync('appstate.json', JSON.stringify(api.getAppState()));
                    resolve(api.getAppState())
                }
            });
        }

    })
}


function main(){
    var initalizeFacebookLogin = facebookLogin()
    initalizeFacebookLogin.then(function(result) {
        login({appState: result}, (err, api) => {
            if(err) return console.error(err);
        
            api.setOptions({listenEvents: true});
            global.api = api
        
            var stopListening = api.listen((err, event) => {
                if(err) return console.error(err);
        
                api.markAsRead(event.threadID, (err) => {
                    if(err) console.error(err);
                });
        
                switch(event.type) {
                    case "message":
                        api.getUserInfo(event.senderID, (err, ret) => {
                            if(err) return console.error(err);
                            for(var prop in ret) {
                                if(ret.hasOwnProperty(prop) && ret[prop].firstName) {
                                    sendSMSMessage(event.body,ret[prop].firstName)
                                }
                            }
                        });
                        break;
                }
            });
        });
    }, function(err){
        console.log(err)
    })
}

main()