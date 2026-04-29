-- LumeFin — Migration 004
-- Auto-create profile on new user registration

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Storage bucket policy for avatars
-- Note: create the 'avatars' bucket manually in Supabase Dashboard
-- Storage → New bucket → name: avatars → Public: true
-- Then run:
create policy "avatar_upload" on storage.objects
  for all using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
