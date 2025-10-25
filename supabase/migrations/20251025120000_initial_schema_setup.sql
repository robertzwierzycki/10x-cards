-- ============================================================================
-- Migration: Initial Schema Setup for 10xCards
-- Date: 2025-10-25
-- Description: Creates the complete database schema for 10xCards application
--              including profiles, decks, flashcards, and study records tables
--              with full RLS policies and performance indexes
--
-- Tables created:
--   - public.profiles (user profile data)
--   - public.decks (flashcard decks)
--   - public.flashcards (individual flashcards)
--   - public.study_records (spaced repetition data)
--
-- Features:
--   - Row Level Security (RLS) enabled on all tables
--   - Automatic updated_at timestamp management
--   - Full-text search indexes for flashcards
--   - Referential integrity with cascade deletes
--   - Check constraints for data validation
-- ============================================================================

-- ============================================================================
-- SECTION 1: HELPER FUNCTIONS
-- ============================================================================

-- function to automatically update updated_at timestamp
-- this reduces application code complexity and ensures consistency
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================================
-- SECTION 2: PROFILES TABLE
-- ============================================================================

-- profiles table extends supabase auth.users with additional user data
-- one-to-one relationship with auth.users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username varchar(50) unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- enable row level security on profiles table
alter table public.profiles enable row level security;

-- trigger to auto-update updated_at column
create trigger on_profiles_updated
  before update on public.profiles
  for each row
  execute procedure public.handle_updated_at();

-- create index for username lookups (used in user search/mentions)
create index idx_profiles_username on public.profiles(username);

-- rls policies for profiles table

-- authenticated users can view all profiles (for future social features)
create policy "authenticated users can view all profiles"
  on public.profiles for select
  to authenticated
  using (true);

-- anonymous users cannot view profiles
create policy "anonymous users cannot view profiles"
  on public.profiles for select
  to anon
  using (false);

-- authenticated users can only insert their own profile
create policy "authenticated users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- authenticated users can only update their own profile
create policy "authenticated users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- authenticated users can only delete their own profile
create policy "authenticated users can delete own profile"
  on public.profiles for delete
  to authenticated
  using (auth.uid() = id);

-- anonymous users cannot insert profiles
create policy "anonymous users cannot insert profiles"
  on public.profiles for insert
  to anon
  with check (false);

-- anonymous users cannot update profiles
create policy "anonymous users cannot update profiles"
  on public.profiles for update
  to anon
  using (false)
  with check (false);

-- anonymous users cannot delete profiles
create policy "anonymous users cannot delete profiles"
  on public.profiles for delete
  to anon
  using (false);

-- ============================================================================
-- SECTION 3: DECKS TABLE
-- ============================================================================

-- decks table stores flashcard collections owned by users
create table public.decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name varchar(255) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- ensure unique deck names per user
  constraint unique_deck_name_per_user unique (user_id, name)
);

-- enable row level security on decks table
alter table public.decks enable row level security;

-- trigger to auto-update updated_at column
create trigger on_decks_updated
  before update on public.decks
  for each row
  execute procedure public.handle_updated_at();

-- index on user_id for fast user deck lookups
create index idx_decks_user_id on public.decks(user_id);

-- rls policies for decks table

-- authenticated users can only view their own decks
create policy "authenticated users can view own decks"
  on public.decks for select
  to authenticated
  using (auth.uid() = user_id);

-- authenticated users can only insert their own decks
create policy "authenticated users can insert own decks"
  on public.decks for insert
  to authenticated
  with check (auth.uid() = user_id);

-- authenticated users can only update their own decks
create policy "authenticated users can update own decks"
  on public.decks for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- authenticated users can only delete their own decks
create policy "authenticated users can delete own decks"
  on public.decks for delete
  to authenticated
  using (auth.uid() = user_id);

-- anonymous users cannot view decks
create policy "anonymous users cannot view decks"
  on public.decks for select
  to anon
  using (false);

-- anonymous users cannot insert decks
create policy "anonymous users cannot insert decks"
  on public.decks for insert
  to anon
  with check (false);

-- anonymous users cannot update decks
create policy "anonymous users cannot update decks"
  on public.decks for update
  to anon
  using (false)
  with check (false);

-- anonymous users cannot delete decks
create policy "anonymous users cannot delete decks"
  on public.decks for delete
  to anon
  using (false);

-- ============================================================================
-- SECTION 4: FLASHCARDS TABLE
-- ============================================================================

-- flashcards table stores individual cards within decks
create table public.flashcards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.decks(id) on delete cascade,
  front varchar(5000) not null,
  back varchar(5000) not null,
  is_ai_generated boolean not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- validate that front and back text are not empty
  constraint check_front_length check (char_length(front) >= 1),
  constraint check_back_length check (char_length(back) >= 1)
);

-- enable row level security on flashcards table
alter table public.flashcards enable row level security;

-- trigger to auto-update updated_at column
create trigger on_flashcards_updated
  before update on public.flashcards
  for each row
  execute procedure public.handle_updated_at();

-- index on deck_id for fast deck content lookups
create index idx_flashcards_deck_id on public.flashcards(deck_id);

-- full-text search indexes for future search functionality
-- these gin indexes enable efficient text searching within flashcards
create index idx_flashcards_front_gin on public.flashcards
  using gin(to_tsvector('simple', front));
create index idx_flashcards_back_gin on public.flashcards
  using gin(to_tsvector('simple', back));

-- rls policies for flashcards table

-- authenticated users can view flashcards in their own decks
create policy "authenticated users can view own flashcards"
  on public.flashcards for select
  to authenticated
  using (
    exists (
      select 1 from public.decks d
      where d.id = flashcards.deck_id
      and d.user_id = auth.uid()
    )
  );

-- authenticated users can insert flashcards in their own decks
create policy "authenticated users can insert own flashcards"
  on public.flashcards for insert
  to authenticated
  with check (
    exists (
      select 1 from public.decks d
      where d.id = flashcards.deck_id
      and d.user_id = auth.uid()
    )
  );

-- authenticated users can update flashcards in their own decks
create policy "authenticated users can update own flashcards"
  on public.flashcards for update
  to authenticated
  using (
    exists (
      select 1 from public.decks d
      where d.id = flashcards.deck_id
      and d.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.decks d
      where d.id = flashcards.deck_id
      and d.user_id = auth.uid()
    )
  );

-- authenticated users can delete flashcards in their own decks
create policy "authenticated users can delete own flashcards"
  on public.flashcards for delete
  to authenticated
  using (
    exists (
      select 1 from public.decks d
      where d.id = flashcards.deck_id
      and d.user_id = auth.uid()
    )
  );

-- anonymous users cannot view flashcards
create policy "anonymous users cannot view flashcards"
  on public.flashcards for select
  to anon
  using (false);

-- anonymous users cannot insert flashcards
create policy "anonymous users cannot insert flashcards"
  on public.flashcards for insert
  to anon
  with check (false);

-- anonymous users cannot update flashcards
create policy "anonymous users cannot update flashcards"
  on public.flashcards for update
  to anon
  using (false)
  with check (false);

-- anonymous users cannot delete flashcards
create policy "anonymous users cannot delete flashcards"
  on public.flashcards for delete
  to anon
  using (false);

-- ============================================================================
-- SECTION 5: STUDY_RECORDS TABLE
-- ============================================================================

-- study_records table tracks spaced repetition data for each user-flashcard pair
create table public.study_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  flashcard_id uuid not null references public.flashcards(id) on delete cascade,

  -- spaced repetition algorithm fields (compatible with fsrs/sm-2)
  due_date timestamptz not null, -- when the card should be reviewed next
  stability numeric, -- how well the card is retained in memory
  difficulty numeric, -- inherent difficulty of the card
  lapses integer, -- number of times the card was forgotten
  state varchar(50), -- current learning state of the card

  last_review_date timestamptz, -- last time the card was reviewed (for metrics)

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- ensure one study record per user-flashcard combination
  constraint unique_study_record_per_user_flashcard unique (user_id, flashcard_id),

  -- validate algorithm field values
  constraint check_difficulty_range
    check (difficulty is null or (difficulty >= 0 and difficulty <= 10)),
  constraint check_stability_positive
    check (stability is null or stability >= 0),
  constraint check_lapses_non_negative
    check (lapses is null or lapses >= 0),
  constraint check_state_values
    check (state is null or state in ('new', 'learning', 'review', 'relearning'))
);

-- enable row level security on study_records table
alter table public.study_records enable row level security;

-- trigger to auto-update updated_at column
create trigger on_study_records_updated
  before update on public.study_records
  for each row
  execute procedure public.handle_updated_at();

-- indexes for efficient querying
create index idx_study_records_user_id on public.study_records(user_id);
create index idx_study_records_flashcard_id on public.study_records(flashcard_id);

-- composite index for efficient "due today" queries
-- this is critical for performance when fetching cards for study sessions
create index idx_study_records_user_due_date on public.study_records(user_id, due_date);

-- rls policies for study_records table

-- authenticated users can only view their own study records
create policy "authenticated users can view own study records"
  on public.study_records for select
  to authenticated
  using (auth.uid() = user_id);

-- authenticated users can only insert their own study records
create policy "authenticated users can insert own study records"
  on public.study_records for insert
  to authenticated
  with check (auth.uid() = user_id);

-- authenticated users can only update their own study records
create policy "authenticated users can update own study records"
  on public.study_records for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- authenticated users can only delete their own study records
create policy "authenticated users can delete own study records"
  on public.study_records for delete
  to authenticated
  using (auth.uid() = user_id);

-- anonymous users cannot view study records
create policy "anonymous users cannot view study records"
  on public.study_records for select
  to anon
  using (false);

-- anonymous users cannot insert study records
create policy "anonymous users cannot insert study records"
  on public.study_records for insert
  to anon
  with check (false);

-- anonymous users cannot update study records
create policy "anonymous users cannot update study records"
  on public.study_records for update
  to anon
  using (false)
  with check (false);

-- anonymous users cannot delete study records
create policy "anonymous users cannot delete study records"
  on public.study_records for delete
  to anon
  using (false);

-- ============================================================================
-- SECTION 6: GRANTS AND PERMISSIONS
-- ============================================================================

-- grant usage on public schema to authenticated and anonymous users
grant usage on schema public to authenticated;
grant usage on schema public to anon;

-- grant all privileges on tables to authenticated users
-- this allows authenticated users to perform crud operations (subject to rls)
grant all on all tables in schema public to authenticated;
grant all on all sequences in schema public to authenticated;

-- grant usage on all sequences to anonymous users (for default values)
-- but no table access (controlled by rls policies)
grant usage on all sequences in schema public to anon;

-- ============================================================================
-- SECTION 7: COMMENTS FOR DOCUMENTATION
-- ============================================================================

-- add comments to tables for better understanding
comment on table public.profiles is 'User profile information extending auth.users';
comment on table public.decks is 'Flashcard decks owned by users';
comment on table public.flashcards is 'Individual flashcards within decks';
comment on table public.study_records is 'Spaced repetition study data for user-flashcard pairs';

-- add comments to important columns
comment on column public.flashcards.is_ai_generated is 'Whether the flashcard was generated by AI (true) or created manually (false)';
comment on column public.study_records.due_date is 'Next scheduled review date for the flashcard';
comment on column public.study_records.last_review_date is 'Last time the user reviewed this flashcard (used for activity metrics)';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================