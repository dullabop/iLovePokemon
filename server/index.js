const express = require('express');
const ejs = require ('ejs');
const path = require ('path');
const { response } = require('express');
const session = require ('express-session')
const mongoose = require('mongoose');
const {BlogPost, User} = require('./server/models.js')
const bcrypt = require('bcrypt');

//Navigation

const clientPath = path.join(__dirname,'../client/')
const staticPath = path.join(clientPath,'/static/');
const viewPath = path.join(clientPath,'/views/')

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
app.use(express.urlencoded({extended: true}));
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

app.get('/register', (req, res) => {
    res.render('register', {data: req.session})
});

app.get('/login', (req, res) => {
    res.render('login', {data: req.session})
});

app.post('/register', async (req, res)=>{
    try {
        let rawpass = req.body.password;
        var hashedpass = await bcrypt.hash(rawpass, 10);
        var user = new User(req.body);
        user.password = hashedpass;
        await user.save();
        res.redirect('/login');
    }
    catch(e) {
        console.log(e);
        res.send("Unable to register!");
    }
})

app.post('/login', (req, res)=>{
    User.findOne({username: req.body.username}, async (error, result)=>{
        if(error) {
            console.log(error);
            res.send("!");
        }
        else if(!result) res.send("User not found.");
        else {
            try {
                let match = await bcrypt.compare(req.body.password, result.password);
                if(match) {
                    req.session.username = result.username;
                    req.session.authenticated = true;
                    req.session.isPokemonLover = result.isPo;
                    res.redirect('/blog/');
                }
                else res.send('Wrong Password Bro!');
            }
            catch(e) {
                console.log(e);
                res.send('Error');
            }

        }
    })

app.get ('/',  (req, res)=>{
    res.render('index', {data: req.session});
});

app.get ('/Favorites', (req, res)=>{
    res.render('favorites', {data: req.session});
});


//Blog Routes

const authenticated = function(req, res, next) {
    if(req.session.authenticated) next();
    else res.redirect('/login');
}

const PokemonLover = function(req, res, next) {
    if(req.session.isPokemonLover) next();
    else res.send('Adios, Amigo.');
}

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

app.get('/blog/write/', authenticated, PokemonLover, (req, res)=>{
    res.render('writing', {data: req.session, draft: {}});
});

app.get('/blog/:id', async (req,res) =>{
    var searchID = req.params.id;
    BlogPost.findById({_id: searchID}, (error, result)=>{
        if(error){
            console.log(error);
            res.redirect('/blog');
        }
        else if(!result){
            res.status(404);
        }
        else{
            console.log(result);
            let parsedText = result.body.replace(/\r\n|\r|\n/g,"<br />");
            result.parsedText = parsedText;
            res.render('entry', {data: req.session, entry: result});
        }   
    })
})

app.post('/blog/writepost', authenticated, PokemonLover, async (req, res)=>{
    console.log(req.body);
    try {
        let newPost = new BlogPost(req.body);
        newPost.author = req.session.username;
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

app.post ('/blog/:id/edit', authenticated, PokemonLover, (req, res)=>{
    BlogPost.findById(req.params.id, (error, result)=>{
        if(error){
            console.log(error);
            res.status(500);
        } else if (result) {
            result.title = req.body.title;
            result.body = req.body.body;
            result.save();
            res.redirect(path.join('/blog/', req.params.id));
        }
        else res.redirect('/blog/');
    })
})

app.put('/blog/update', (req, res)=>{
		console.log(req)
		res.redirect('/blog/')
	})


app.get('/blog/:id/delete', PokemonLover, (req, res)=>{
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

    app.post('/blog/:id/comment', authenticated, (req, res)=>{
        BlogPost.findById(req.params.id, (error, result)=>{
            if(error) {
                console.log(error);
                res.send('Error');
            }
            else if(!result) {
                res.redirect('/blog/');
            }
            else {
                result.comments.push({author: req.session.username, text: req.body.comment});
                result.save();
                res.redirect(path.join('/blog/', req.params.id+'/'));
            }
        });
    });

    app.post('/blog/:id/deletecomment/:comment', authenticated, PokemonLover, (req, res)=>{
        BlogPost.findById(req.params.id, (error, result)=>{
            if(error) {
                console.log(error);
                res.redirect('/');
            }
            else if(!result) {
                res.send('Ummm thats not right...');
            }
            else {
                result.comments.id(req.params.comment).remove();
                result.save();
                res.redirect('/blog/'+req.params.id+'/');
            }
        });
    });
})
app.listen(2000);