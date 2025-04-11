-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function for auto-updating updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE groups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT true,
  password TEXT, -- Chỉ required khi is_public = false
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

CREATE TRIGGER set_timestamp BEFORE UPDATE ON groups
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  account_number TEXT,
  bank TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

CREATE TRIGGER set_timestamp BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE group_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- 'admin' or 'member'
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  UNIQUE(group_id, user_id)
);

CREATE TRIGGER set_timestamp BEFORE UPDATE ON group_members
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  payer UUID NOT NULL, -- Thay đổi từ TEXT sang UUID để match với users.id
  participants TEXT[] NOT NULL,
  split_equally BOOLEAN DEFAULT true,
  individual_amounts JSONB,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

CREATE TRIGGER set_timestamp BEFORE UPDATE ON expenses
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  from_user TEXT NOT NULL,
  to_user TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

CREATE TRIGGER set_timestamp BEFORE UPDATE ON transactions
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
