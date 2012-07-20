var express = require('express');
var qs = require('querystring');
var crypto = require('crypto');
var pg = require('pg');

var app = express.createServer(express.logger());
app.use(express.bodyParser());

var conn_string = process.env.DATABASE_URL || "tcp://michael:1234@localhost/michael";

function create_account(account_id, respond){
    pg.connect(conn_string, function(err, client) {
        console.log(err)
        var query = client.query('insert into account(account_id) values ('+account_id+')');

        query.on('end', function() {
            respond("approve");
        });

        query.on('error', function() {
            respond("approve");
        });
    });
}

function create_domain(body, respond){
    pg.connect(conn_string, function(err, client) {
        console.log(err)
        var query = client.query('insert into domain(account_id, domain_id) values ('+body.account_id+','+body.domain_id+')');

        query.on('end', function() {
            respond("approve");
        });

        query.on('error', function(something) {
            console.log(body)
            console.log(something);
            respond("error");
        });
    });
}

function valid(req) {
    var hmac_secret = '09aed14f2a579b0f50965418c67b600d';
    var hmac = crypto.createHmac("sha256", hmac_secret);
    var contents = JSON.stringify(req.body);
    hmac.update(contents);
    return req.headers.hmac == hmac.digest('hex');
}
app.post('/api/accounts', function(request, response) {
    if (!valid(request)) {
        response.send("Bad HMAC");
    } else {
        var respond = function(status){
            response.send(JSON.stringify({
                "account_id":request.body.account_id,
                "status":status
            }));
        }
        create_account(request.body.account_id, respond);
    };
});

app.post('/api/domains', function(request, response) {
    if (!valid(request)) {
        response.send("Bad HMAC");
    } else {
        var respond = function(status){
            if (status == 'error') {
                response.send("error");
            } else {
                response.send(JSON.stringify({
                    "account_id":request.body.account_id,
                    "domain_id":request.body.domain_id,
                    "status":status
                }));
            }
        }
        create_domain(request.body, respond);
    };
});

var port = 3000 || process.env.PORT || 5000;
app.listen(port, function() {
    console.log("Listening on " + port);
});