const { expect } = require('chai');
const knex = require('knex');
const app = require('../src/app');
const { makeArticlesArray } = require('./articles.fixtures');

let db;

before('make knex instance', () => {
    db = knex({
        client: 'pg',
        connection: process.env.TEST_DB_URL
    });

    app.set('db', db);
});

before('clean the table', () => db('blogful_articles').truncate());

after('disconnect from db', () => db.destroy());

afterEach('cleanup', () => db('blogful_articles').truncate());

describe('GET /articles', function () {
    context('Given no articles', () => {
        it('responds with 200 and an empty list', () => {
            return supertest(app)
                .get('/articles')
                .expect(200, []);
        });
    });

    context('Given there are articles in the database', () => {
        const testArticles = makeArticlesArray();
        beforeEach('insert articles', () => {
            return db
                .into('blogful_articles')
                .insert(testArticles)
        });

        it('GET /articles responds with 200 and all of the articles', () => {
            return supertest(app)
                .get('/articles')
                .expect(200, testArticles);
            // TODO: add more assertions about the body
        });
    });
});

describe('GET /articles/:article_id', () => {
    context('Given no articles', () => {
        it('responds with 404', () => {
            const articleId = 123456;
            return supertest(app)
                .get(`/articles/${articleId}`)
                .expect(404, {error: {message: `Article doesn't exist`}});
        });
    });

    context('Given there are articles in the database', () => {
        const testArticles = makeArticlesArray();

        beforeEach('insert articles', () => {
            return db
                .into('blogful_articles')
                .insert(testArticles);
        });

        it('GET /articles/:article_id responds with 200 and the specficied article', () => {
            const articleId = 2;
            const expectedArticle = testArticles[articleId - 1];
            return supertest(app)
                .get(`/articles/${articleId}`)
                .expect(200, expectedArticle);
        });
    });
});

describe.only('POST /articles', () => {
    it('creates an article, responding with 201 and the new article', function() {
        this.retries(3);
        const newArticle = {
            title: 'Test new article',
            style: 'Listicle',
            content: 'Test new article content...'
        };
        return supertest(app)
            .post('/articles')
            .send(newArticle)
            .expect(201)
            .expect(res => {
                expect(res.body.title).to.eql(newArticle.title);
                expect(res.body.style).to.eql(newArticle.style);
                expect(res.body.content).to.eql(newArticle.content);
                expect(res.body).to.have.property('id');
                expect(res.headers.location).to.eql(`/articles/${res.body.id}`);
                const expectedTime = new Date().toLocaleString();
                const actualTime = new Date(res.body.date_published).toLocaleString();
                expect(actualTime).to.eql(expectedTime);
            })
            .then(postRes => // Checkpoint notes the implicit return so Mocha knows to wait
                supertest(app)
                    .get(`/articles/${postRes.body.id}`)
                    .expect(postRes.body)
            );
            // Checkpoint also notes that we coul dhave used knex to check the database directly
            // for the POSTed article.
    });
});
