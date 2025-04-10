create table expenses (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  amount decimal not null,
  date date default current_date,
  payer text not null,
  participants text[] not null,
  split_equally boolean default true,
  individual_amounts jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
