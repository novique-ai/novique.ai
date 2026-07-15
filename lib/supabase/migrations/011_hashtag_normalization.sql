-- Normalize social hashtags to the schema/UI convention: store tags without #.
-- Safe to re-run; rows without a leading # remain unchanged.
UPDATE social_posts
SET hashtags = ARRAY(
  SELECT regexp_replace(item.tag, '^#+', '')
  FROM unnest(social_posts.hashtags) WITH ORDINALITY AS item(tag, ordinality)
  ORDER BY item.ordinality
)
WHERE social_posts.hashtags IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM unnest(social_posts.hashtags) AS tag
    WHERE tag LIKE '#%'
  );
