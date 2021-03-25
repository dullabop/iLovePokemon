const express = require('express');
const ejs = require ('ejs');
const path = require('path');
const bodyParser= require('body-parser');
const session = require('express.session');
const mongoose = require('mongoose');
const {BlogPost} = require('./models.js')

//Navigation

const clientPath = path.join(__dirname,'../client/');
const staticPath = path.join(clientPath,'/static/');
const viewsPath = path.join(clientPath,'/views/');

//Basic Server

const app = express();
app.use(express.static(staticPath));
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
		name: 'pokemons',
		secret: 'eachpokehad7pokemons',
		saveUninitialized: false,
		resave: false,
		cookie: {
			maxAge: 1000*60*60*24*3,
		}
}))

mongoose.connect('mongodb://localhost:27017/pokemon', {useNewUrlParser: true});
app.listen(2000);

//Setting Views

app.set('view engine','ejs');
app.set('views',viewsPath);

app.use((req, res, next)=>{
	console.log(req.originalUrl);
	next();
})

//Routes


app.get('/', function(req, res) {
	console.log(req.session);
	res.render('index', {data: req.session});
});

app.get('/Favorites', counter, function(req, res) {
	res.render('Favorites', {data: req.session});
});

app.get('/blog', (req, res) => {
	var posts = await BlogPost.find({}, (error, result) =>{
		if(error) {
			console.log(error);
			res.sendStatus(500);
		}
		console.log(result);
		res.render('blog', {data: req.session, postset: result});
	});
	res.render('blog' , {data: req.session, postset: posts});
});

app.get('blog/write/', (req, res) => {
	res.render('writing', {data: req.session});
});

app.get('/blog/ :id', async (req,res) =>{
	var searchID = req.params.id;
	BlogPost.findById({_id: searchID}, (error, result) =>{
		if (error) {
			res.redirect('/blog/');
		}
		else if(!result) res.redirect('/blog/');
		else{
			res.render('entry', {data: req.session, entry: result });
		}
	})
});

app.post('/blog/writepost', async (req, res) => {
	console.log(req.body);
	let newPost = new BlogPost(req.body);
	await newPost.save();
	res.render('entry', {data: req.session, entry: {}});
});

app.post('/welcome', (req, res) => {
	req.session.username=req.body.nombre;
	res.send('SUCCESS');
});

app.put('/blog/update', (req, res)=>{
	console.log(req);
	res.redirect('/blog');
});

app.delete('/blog/delete', (req, res)=>{
	console.log(req);
	res.redirect('/blog');
});