-- 电影/字幕信息表
CREATE TABLE movies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  poster_url TEXT,
  subtitle_url TEXT, -- 在 Storage 中的路径
  word_count INT DEFAULT 0, -- 词汇总数
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 用户学习进度表
CREATE TABLE user_progress (
  id BIGSERIAL PRIMARY KEY,
  movie_id UUID REFERENCES movies(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  review_count INT DEFAULT 0,
  next_review_date TIMESTAMPTZ,
  interval INT DEFAULT 0,
  ease_factor FLOAT DEFAULT 2.5,
  proficiency TEXT, -- 单词熟练度 ('beginner', 'intermediate', 'advanced')
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(movie_id, word) -- 确保每个电影下每个单词只有一条进度
);

-- 创建更新时间戳触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE
ON user_progress FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();