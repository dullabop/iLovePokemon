const express = require('express');
const ejs = require ('ejs');
const path = require('path');

//Navigation

const clientPath = path.join(__dirname,'../client/');
const staticPath = path.join(clientPath,'/static/');
const viewsPath = path.join(clientPath,'/views/');

const app = express();
app.use(express.static(staticPath));
app.listen(2000);

app.set('view engine','ejs');
app.set('views',viewsPath);

//Vistor Counter

var x = 0;

const counter = function(req, res, next) {
	x++;
	console.log(x);
	next();
}
//used to activate the counter
app.use(counter);    

app.get('/', function(req, res) {
	res.render('index');
});

app.get('/favorites', counter, function(req, res) {
	res.render('famous');
});


