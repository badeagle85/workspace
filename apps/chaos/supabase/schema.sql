-- ============================================
-- WC3 카오스 커뮤니티 관리 시스템 스키마
-- prefix: chaos_
-- ============================================

-- 권한 레벨
CREATE TYPE chaos_user_role AS ENUM ('admin', 'master', 'staff', 'user', 'banned');

-- 플레이어 상태
CREATE TYPE chaos_player_status AS ENUM ('active', 'resting', 'banned', 'new');

-- 티어
CREATE TYPE chaos_tier_level AS ENUM ('1', '2', '2.5', '3', '3.5', '4', '5', '6', '7');

-- ============================================
-- 유저 테이블 (로그인/권한용)
-- ============================================
CREATE TABLE chaos_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255), -- 단순 비밀번호용 (나중에 Discord OAuth로 대체)
  role chaos_user_role DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 플레이어 테이블 (게임 내 유저)
-- ============================================
CREATE TABLE chaos_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  tier chaos_tier_level NOT NULL,
  status chaos_player_status DEFAULT 'active',
  ban_reason VARCHAR(200),
  ban_date DATE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_chaos_players_tier ON chaos_players(tier);
CREATE INDEX idx_chaos_players_status ON chaos_players(status);
CREATE INDEX idx_chaos_players_name ON chaos_players(name);

-- ============================================
-- 티어 점수 설정
-- ============================================
CREATE TABLE chaos_tier_scores (
  tier chaos_tier_level PRIMARY KEY,
  score DECIMAL(3,1) NOT NULL
);

-- 기본 티어 점수 삽입
INSERT INTO chaos_tier_scores (tier, score) VALUES
  ('1', 8.5),
  ('2', 7.0),
  ('2.5', 6.5),
  ('3', 6.0),
  ('3.5', 5.0),
  ('4', 4.0),
  ('5', 3.0),
  ('6', 2.0),
  ('7', 1.0);

-- ============================================
-- 공지사항
-- ============================================
CREATE TABLE chaos_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES chaos_users(id),
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 대회
-- ============================================
CREATE TABLE chaos_tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  winners TEXT[], -- 우승자 이름 배열
  sponsors JSONB, -- { "name": "금액" }
  prize_pool INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- updated_at 자동 갱신 트리거
-- ============================================
CREATE OR REPLACE FUNCTION chaos_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chaos_users_updated_at
  BEFORE UPDATE ON chaos_users
  FOR EACH ROW EXECUTE FUNCTION chaos_update_updated_at();

CREATE TRIGGER chaos_players_updated_at
  BEFORE UPDATE ON chaos_players
  FOR EACH ROW EXECUTE FUNCTION chaos_update_updated_at();

CREATE TRIGGER chaos_announcements_updated_at
  BEFORE UPDATE ON chaos_announcements
  FOR EACH ROW EXECUTE FUNCTION chaos_update_updated_at();

-- ============================================
-- RLS (Row Level Security) 정책
-- ============================================

-- 플레이어: 누구나 읽기 가능
ALTER TABLE chaos_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chaos_players_read" ON chaos_players
  FOR SELECT USING (true);

CREATE POLICY "chaos_players_write" ON chaos_players
  FOR ALL USING (true); -- 나중에 권한 체크 추가

-- 티어 점수: 누구나 읽기 가능
ALTER TABLE chaos_tier_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chaos_tier_scores_read" ON chaos_tier_scores
  FOR SELECT USING (true);

-- 공지사항: 누구나 읽기 가능
ALTER TABLE chaos_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chaos_announcements_read" ON chaos_announcements
  FOR SELECT USING (true);

CREATE POLICY "chaos_announcements_write" ON chaos_announcements
  FOR ALL USING (true); -- 나중에 권한 체크 추가

-- 대회: 누구나 읽기 가능
ALTER TABLE chaos_tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chaos_tournaments_read" ON chaos_tournaments
  FOR SELECT USING (true);
