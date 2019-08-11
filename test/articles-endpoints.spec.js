const { expect } = require('chai');
const knex = require('knex');
const app = require('../src/app');
const { makeArticlesArray, makeMaliciousArticle } = require('./articles.fixtures');

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

describe('GET /api/articles', function () {
    context('Given no articles', () => {
        it('responds with 200 and an empty list', () => {
            return supertest(app)
                .get('/api/articles')
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

        it('GET /api/articles responds with 200 and all of the articles', () => {
            return supertest(app)
                .get('/api/articles')
                .expect(200, testArticles);
            // TODO: add more assertions about the body
        });
    });

    context(`given an XSS attack article`, () => {
        const { maliciousArticle, sanitizedArticle } = makeMaliciousArticle();
        // const maliciousArticle = {
        //     id: 911,
        //     title: 'Naughty naughty very naughty <script>alert("xss");</script>',
        //     style: 'How-to',
        //     content: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`
        // };

        beforeEach('insert malicious article', () => {
            return db
                .insert(maliciousArticle)
                .into('blogful_articles');
        });

        it(`removes XSS attack content`, () => {
            return supertest(app)
                .get(`/api/articles`)
                .expect(200)
                .expect(res => {
                    // expect(res.body[0].title).to.eql('Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;');
                    // expect(res.body[0].content).to.eql(`Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`);
                    expect(res.body[0].title).to.eql(sanitizedArticle.title);
                    expect(res.body[0].content).to.eql(sanitizedArticle.content);
                });
        });
    });
});

describe('GET /api/articles/:article_id', () => {
    context('Given no articles', () => {
        it('responds with 404', () => {
            const articleId = 123456;
            return supertest(app)
                .get(`/api/articles/${articleId}`)
                .expect(404, {error: {message: `Article does not exist`}});
        });
    });

    context('Given there are articles in the database', () => {
        const testArticles = makeArticlesArray();

        beforeEach('insert articles', () => {
            return db
                .into('blogful_articles')
                .insert(testArticles);
        });

        it('GET /api/articles/:article_id responds with 200 and the specficied article', () => {
            const articleId = 2;
            const expectedArticle = testArticles[articleId - 1];
            return supertest(app)
                .get(`/api/articles/${articleId}`)
                .expect(200, expectedArticle);
        });
    });

    context(`given an XSS attack article`, () => {
        const { maliciousArticle, sanitizedArticle } = makeMaliciousArticle();
        // const maliciousArticle = {
        //     id: 911,
        //     title: 'Naughty naughty very naughty <script>alert("xss");</script>',
        //     style: 'How-to',
        //     content: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`
        // };
        beforeEach('insert malicious article', () => {
            return db
                .insert(maliciousArticle)
                .into('blogful_articles');
        });

        it(`removes XSS attack content`, () => {
            return supertest(app)
                .get(`/api/articles/${maliciousArticle.id}`)
                .expect(200)
                .expect(res => {
                    // expect(res.body.title).to.eql('Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;');
                    // expect(res.body.content).to.eql(`Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`);
                    expect(res.body.title).to.eql(sanitizedArticle.title);
                    expect(res.body.content).to.eql(sanitizedArticle.content);
                });
        });
    });
});

describe('POST /api/articles', () => {
    it('creates an article, responding with 201 and the new article', function() {
        this.retries(3);
        
        const newArticle = {
            title: 'Test new article',
            style: 'Listicle',
            content: 'Test new article content...'
        };
        
        return supertest(app)
            .post('/api/articles')
            .send(newArticle)
            .expect(201)
            .expect(res => {
                expect(res.body.title).to.eql(newArticle.title);
                expect(res.body.style).to.eql(newArticle.style);
                expect(res.body.content).to.eql(newArticle.content);
                expect(res.body).to.have.property('id');
                expect(res.headers.location).to.eql(`/api/articles/${res.body.id}`);
                const expectedTime = new Date().toLocaleString();
                const actualTime = new Date(res.body.date_published).toLocaleString();
                expect(actualTime).to.eql(expectedTime);
            })
            .then(postRes => // Checkpoint notes the implicit return so Mocha knows to wait
                supertest(app)
                    .get(`/api/articles/${postRes.body.id}`)
                    .expect(postRes.body)
            );
            // Checkpoint also notes that we could have used knex to check the database directly
            // for the POSTed article.
    });

    const requiredFields = ['title', 'style', 'content'];
    requiredFields.forEach(field => {
        const newArticle = {
            title: 'Test new article',
            style: 'Listicle',
            content: 'Test new article content...'
        };

        it(`responds with 400 and an error message when '${field}' is missing`, () => {
            delete newArticle[field];

            return supertest(app)
                .post('/api/articles')
                .send(newArticle)
                .expect(400, {error: {message: `Missing '${field}' in request body`}});
        });
    });

    context(`given an XSS attack article`, () => {
        const { maliciousArticle, sanitizedArticle } = makeMaliciousArticle();
        // const maliciousArticle = {
        //     id: 911,
        //     title: 'Naughty naughty very naughty <script>alert("xss");</script>',
        //     style: 'How-to',
        //     content: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`
        // };

        beforeEach('insert malicious article', () => {
            return db
                .insert([maliciousArticle])
                .into('blogful_articles');
        });

        it(`removes XSS attack content`, () => {
            return supertest(app)
                .post(`/api/articles`)
                .send(maliciousArticle)
                .expect(201)
                .expect(res => {
                    expect(res.body).to.have.property('id')
                    // expect(res.body.title).to.eql('Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;')
                    // expect(res.body.content).to.eql(`Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`);
                    expect(res.body.title).to.eql(sanitizedArticle.title);
                    expect(res.body.content).to.eql(sanitizedArticle.content);
                })
        });
    });
});

describe(`DELETE /api/articles/:article_id`, () => {
    context(`Given there are articles in the database`,() => {
        const testArticles = makeArticlesArray();

        beforeEach(`insert articles`, () => {
            return db
                .insert(testArticles)
                .into('blogful_articles');
        });

        it(`responds with 204 and removes the article`, () => {
            const idToRemove = 2;
            const expectedArticles = testArticles.filter(article => article.id !== idToRemove);
            return supertest(app)
                .delete(`/api/articles/${idToRemove}`)
                .expect(204)
                .then(res => 
                    supertest(app)
                    .get(`/api/articles`)
                    .expect(expectedArticles)
                );
        });
    });

    context(`Given no articles`, () => {
        it(`rresponds with 404`, () => {
            const articleId = 123456;
            return supertest(app)
                .delete(`/api/articles/${articleId}`)
                .expect(404, {error: {message: `Article does not exist`}});
        });
    });
});
