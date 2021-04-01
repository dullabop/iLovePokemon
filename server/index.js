const express = require('express');
const ejs = require ('ejs');
const path = require ('path');
const { response } = require('express');
const bodyParser = require('body-parser');
const session = require ('express-session')
const mongoose = require('mongoose');
const {BlogPost} = require('./models.js')

//Navigation

const clientPath = path.join(__dirname,'../client/')
const staticPath = path.join(clientPath,'/static/');
const viewsPath = path.join(clientPath,'/views/')

//Basic Server

const app = express();

app.set ('view engine','ejs');
app.set ('views', viewPath);

var x=0;

const counter= function(req,res,next){
    x++;
    console.log(x);
    next();
}

app.use (express.static(staticPath));
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
    name: 'pokemons',
    secret: 'eachpokemonshad7trainers',
    saveUninitialized: false,
    resave: true,
    cookie: {
        maxAge: 1000*60*60*24*3,
    }
}));

mongoose.connect('mongodb://localhost:27017/pokemon',{useNewUrlParser: true});

//Setting Views



app.use((req, res, next)=>{
    console.log(req.originalUrl);
    next();
})

//Routes


app.get ('/',  (req, res)=>{
    res.render('index', {data: req.session});
});

app.get ('/Favorites', (req, res)=>{
    res.render('favorites', {data: req.session});
});

app.get ('/blog/', async (req, res) =>{
    var posts= BlogPost.find({}, (error, result)=>{
        if(error){
            console.log(error);
            res.sendStatus(500);
        }
        console.log(result);
        res.render('blog', {data: req.session, postset: result});
    });
});

app.get('/blog/write/', (req, res)=>{
    res.render('writing', {data: req.session, draft: {}});
});

app.get('/blog/:id', async (req,res) =>{
    var searchID = req.params.id;
    BlogPost.findById({_id: searchID}, (error, result)=>{
        if(error){
            res.redirect('/blog');
        }
        else if(!result) res.redirect('/blog/');
        else{
            res.render('entry', {data: req.session, entry: result});
        }   
    })
})

app.post('/blog/writepost', async (req, res)=>{
    console.log(req.body);
    try {
        let newPost = new BlogPost(req.body);
        await newPost.save();
        res.redirect('/blog/');
    }
    catch(e) {
        console.log(e);
        res.redirect('/blog/write/');
    }
});

app.post ('/welcome' , (req, res)=>{
    console.log(req.body)
    req.session.username=req.body.nombre;
    res.send('SUCCESS');
    })

app.get ('/blog/:id/edit', (req, res)=>{
		BlogPost.findById({id: req.params.id}, (error, result)=>{
			if(error) res.redirect('/blog/')
			else if (!result) res.redirect('/blog/')
			res.render('writing', {data: req.session, draft: result})
		})
	})

app.put('/blog/update', (req, res)=>{
		console.log(req)
		res.redirect('/blog/')
	})


app.get('/blog/:id/delete', (req, res)=>{
		BlogPost.deleteOne({id: req.params.id}, (error, result)=>{
			if(error){
				console.log(error);
			}
			res.redirect('/blog/')
		})
	})
app.use((req, res, next)=>{
		console.log(req.originalUrl);
		next();
	})

app.listen(2000);