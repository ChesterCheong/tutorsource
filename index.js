var express = require('express');
var app = express();
var model = require('./model.js');
var paypal = require('paypal-rest-sdk');

paypal.configure({
    'mode': process.env.PAYPAL_MODE, //sandbox or live
    'client_id': process.env.PAYPAL_CLIENT_ID,
    'client_secret': process.env.PAYPAL_CLIENT_SECRET
});

//tells the server to look into the /public folder for the static content
app.use(express.static(__dirname + '/public'));

//Creates the plans based on what is defined in model.js. 
app.get('/payment/create-plan', function (req, res) {
    var plans = Object.keys(model.plans);
    for(var i = 0; i < plans.length; i++){
        //goes through each of the plans defined in model.js
        var plan = model.plans[plans[i]];
        paypal.billingPlan.create(plan, function(error, billingPlan){
            //creates the plan
            if(error){
                throw error;
            }
            //activates the plan
            paypal.billingPlan.update(billingPlan.id, model.activatePlan, function(error, response){
                if(error){
                    throw error;
                }
                var plan = "";
                //sets the plan id based on the plan name sent to PayPal
                if(billingPlan.name == "Regular Plan"){
                    plan = "2000";
                }
                else{
                    plan = "10000";
                }
                //stores the PayPal Plan ID to your plan id mapping in Firebase
                model.firebase.child('/plans').child('/' + plan).set({'id': billingPlan.id});
            });
        });
    }
    res.json({'status':'success'});
})


