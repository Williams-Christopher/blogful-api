const express = require('express');
const ArticlesService = require('./articles-service');
const articlesRouter = express.Router();
const jsonParser = express.json();

articlesRouter.route('/')
    .get((req, res, next) => {
        //res.send('All articles');
        const knexInstance = req.app.get('db');
        ArticlesService.getAllArticles(knexInstance)
            .then(articles => {
                res.json(articles);
            })
            .catch(next);
    })
    .post(jsonParser, (req, res, next) => {
        //res.status(201).send('stuff'); // enough to make the test pass but not what is needed
        // res.status(201).json({  // Still enough to make the test pass but not what is needed
        //     ...req.body,        // Write the test to make the POST and then GET /srticles/:id
        //     id: 12              // with the id in the response.
        // });
        const { title, content, style } = req.body;
        const newArticle = { title, content, style };
        ArticlesService.insertArticle(req.app.get('db'), newArticle)
            .then(article => {
                res
                    .status(201)
                    .location(`/articles/${article.id}`)
                    .json(article);
            })
            .catch(next);
    });

articlesRouter.route('/:article_id')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db');
        ArticlesService.getById(knexInstance, req.params.article_id)
            .then(article => {
                if (!article) {
                    return res.status(404).json({ error: { message: `Article doesn't exist` } });
                };
                res.json(article);
            })
            .catch(next);
    });

module.exports = articlesRouter;
