create type article_category as enum (
    'Listicle',
    'How-to',
    'News',
    'Interview',
    'Story'
);

alter table blogful_articles
    add column
        style article_category;
