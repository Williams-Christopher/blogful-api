const express = require('express');
const ArticlesService = require('./articles-service');
const articlesRouter = express.Router();
const jsonParser = express.json();
const xss = require('xss');
const path = require('path');

// borrowing from the 'official' drill solution
// https://github.com/Thinkful-Ed/blogful-api/blob/master/src/articles/articles-router.js
const serializeArticle = article => ({
    id: article.id,
    style: article.style,
    title: xss(article.title),
    content: xss(article.content),
    date_published: article.date_published,
});

articlesRouter.route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db');
        ArticlesService.getAllArticles(knexInstance)
            .then(articles => {
                // const sanitizedArticles = articles.map(function(article) {
                //     return ({id: article.id, style: article.style, title: xss(article.title), content: xss(article.content), date_published: article.date_published})
                // });
                //res.json(sanitizedArticles);
                res.json(articles.map(serializeArticle))
            })
            .catch(next);
    })
    .post(jsonParser, (req, res, next) => {
        const { title, content, style } = req.body;
        const newArticle = { title, content, style };

        for (const [key, value] of Object.entries(newArticle)) {
            if(value == null) {
                return res.status(400).json({error: {message: `Missing '${key}' in request body`}});
            }
        }

        ArticlesService.insertArticle(req.app.get('db'), newArticle)
            .then(article => {
                res
                    .status(201)
                    //.location(`/articles/${article.id}`)
                    //.location(req.originalUrl + `/${article.id}`) // if the original path ends with / this causes a double slash in the response
                    .location(path.posix.join(req.originalUrl + `/${article.id}`)) // this figures out the double slash issue and constructs a proper path
                    // .json({
                    //     id: article.id,
                    //     style: article.style,
                    //     title: xss(article.title),
                    //     content: xss(article.content),
                    //     date_published: article.date_published
                    // });
                    .json(serializeArticle(article));
            })
            .catch(next);
    });

articlesRouter.route('/:article_id')
    .all((req, res, next) => {
        ArticlesService.getById(req.app.get('db'), req.params.article_id)
            .then(article => {
                if(!article) {
                    return res.status(404).json({ error: { message: `Article does not exist` } });
                };
                res.article = article; // Save the article for the next middleware
                next(); // call next() so the next middleware happens
            })
            .catch(err => {console.log(err)});
    })
    .get((req, res, next) => {
        res.json(serializeArticle(res.article));
    })
    .delete((req, res, next) => {
        ArticlesService.deleteArticle(req.app.get('db'), req.params.article_id)
            .then(() => {
                res.status(204).end();
            })
            .catch();
    })
    .patch(jsonParser, (req, res, next) => {
        const { title, content, style } = req.body;
        const articleToUpdate = { title, content, style};

        const numberOfValues = Object.values(articleToUpdate).filter(Boolean).length;
        if(numberOfValues === 0) {
            return res.status(400).json({error: { message: `Request body must contain 'title', 'style', or 'content`}});
        }

        ArticlesService.updateArticle(req.app.get('db'), req.params.article_id ,articleToUpdate)
            .then(numRowsAffected => {
                console.log('rows: ', numRowsAffected)
                res.status(204).end();
            })
            .catch(next);
    });

    module.exports = articlesRouter;
