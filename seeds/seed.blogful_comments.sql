truncate table blogful_comments;

INSERT INTO blogful_comments (text, date_commented, article_id, user_id)
values
('A wonderful comment!', now(), 1, 1),
('Another wonderfule comment!', now(), 1, 2),
('Comment comment', now(), 2, 3),
('Lorem ipsum dolor sit amet, consectetur adipisicing elit.', now(), 3, 1),
('Lorem ipsum dolor sit amet, consectetur adipisicing elit.', now(), 3, 2);
