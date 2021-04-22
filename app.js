var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var neo4j = require('neo4j-driver');

var app = express();
//view Engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

var driver = neo4j.driver('bolt://localhost', neo4j.auth.basic('neo4j', '12345'));
var session = driver.session();


app.get('/', function (req, res) {
    session
        .run('MATCH(n:Movie) Return n LIMIT 25')
        .then(function (result) {
            var movieArr = [];

            result.records.forEach(function (record) {
                movieArr.push({
                    id: record._fields[0].identity.low,
                    title: record._fields[0].properties.title, // should be name
                    year: record._fields[0].properties.year
                })
                // console.log(record._fields[0].properties);
            });

            session
                .run('MATCH(n:Person) Return n LIMIT 25')
                .then(function (results2) {
                    var personArr = [];
                    results2.records.forEach(function (record) {
                        personArr.push({
                            id: record._fields[0].identity.low,
                            name: record._fields[0].properties.name // just like here
                        })
                    });
                    res.render('index', {
                        movies: movieArr,
                        persons: personArr
                    });
                })
                .catch(function (err) {
                    console.log(err);
                });

        })
        .catch(function (err) {
            console.log(err);
        });
    // res.send('It works');

});

app.post('/movie/add', function (req, res) {
    var title = req.body.title;
    var year = req.body.year;

    session
        .run(`CREATE(n:Movie {title:$titleParam,year:$yearParam}) RETURN n.title`, { titleParam: title, yearParam: year })
        .then(function (result) {
            res.redirect('/');
            session.close();
        })
        .catch(function (err) {
            console.log(err);
        })


    res.redirect('/');
});

app.post('/person/add', function (req, res) {
    var name = req.body.name;

    session
        .run(`CREATE(n:Person {name:$nameParam}) RETURN n.name`, { nameParam: name })
        .then(function (result) {
            res.redirect('/');
            session.close();
        })
        .catch(function (err) {
            console.log(err);
        })

    res.redirect('/');
});


app.post('/movie/person/add', function (req, res) {
    var title = req.body.title;
    var name = req.body.name;


    session
        .run(`MATCH(a:Person {name:$nameParam}),(b:Movie{title:$titleParam}) MERGE(a)-[r:CONNECTED_TO]-(b) RETURN a,b`, { titleParam: title, nameParam: name })
        .then(function (result) {
            res.redirect('/');
            session.close();
        })
        .catch(function (err) {
            console.log(err);
        })

    res.redirect('/');
});

app.listen(3000);
console.log('Server Started on port 3000');

module.exports = app;
