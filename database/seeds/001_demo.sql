INSERT INTO users (username, password_hash, role, display_name, phone)
VALUES
  ('admin', crypt('123456', gen_salt('bf')), 'admin', '管理员', NULL),
  ('student-demo', crypt('123456', gen_salt('bf')), 'student', '演示学生', '13800000001'),
  ('counselor-demo', crypt('123456', gen_salt('bf')), 'counselor', '演示咨询师', '13800000002')
ON CONFLICT (username) DO NOTHING;

INSERT INTO article_categories (name)
VALUES ('心理科普'), ('校园适应'), ('情绪管理')
ON CONFLICT (name) DO NOTHING;

INSERT INTO counselors (user_id, name, gender, specialty, available_time, phone, bio, rating)
SELECT id, '演示咨询师', '女', '情绪管理、校园适应', '周一至周五 14:00-18:00', '13800000002', '专注学生心理支持与压力管理。', 4.80
FROM users
WHERE username = 'counselor-demo'
  AND NOT EXISTS (
    SELECT 1 FROM counselors WHERE user_id = users.id
  );

INSERT INTO articles (category_id, author_id, title, summary, content, status, published_at)
SELECT c.id, u.id, '如何识别压力信号', '从睡眠、情绪和注意力三个角度识别近期压力变化。', '压力不总是以崩溃的方式出现。持续疲惫、入睡困难、容易烦躁、注意力下降，都可能是需要放慢节奏的信号。', 'published', now()
FROM article_categories c
CROSS JOIN users u
WHERE c.name = '心理科普' AND u.username = 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM articles WHERE title = '如何识别压力信号'
  );

INSERT INTO forum_posts (author_id, title, content, status)
SELECT id, '最近如何缓解压力？', '欢迎分享最近有效的放松方式，比如运动、睡眠调整、和朋友聊天等。', 'published'
FROM users
WHERE username = 'student-demo'
  AND NOT EXISTS (
    SELECT 1 FROM forum_posts WHERE title = '最近如何缓解压力？'
  );

INSERT INTO forum_comments (post_id, author_id, content, status)
SELECT p.id, u.id, '我一般会先把当天最焦虑的事情写下来，再决定明天处理哪一件。', 'published'
FROM forum_posts p
CROSS JOIN users u
WHERE p.title = '最近如何缓解压力？'
  AND u.username = 'counselor-demo'
  AND NOT EXISTS (
    SELECT 1 FROM forum_comments WHERE post_id = p.id AND content = '我一般会先把当天最焦虑的事情写下来，再决定明天处理哪一件。'
  );
