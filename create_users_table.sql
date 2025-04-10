create table users (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  account_number text,
  bank text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trigger để tự động cập nhật updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

create trigger update_users_updated_at
    before update on users
    for each row
    execute procedure update_updated_at_column();