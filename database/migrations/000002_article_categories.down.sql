DROP INDEX IF EXISTS idx_article_categories_active_name;

ALTER TABLE article_categories
  DROP COLUMN IF EXISTS updated_at,
  DROP COLUMN IF EXISTS is_active;
