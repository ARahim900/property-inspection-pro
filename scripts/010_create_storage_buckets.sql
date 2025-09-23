-- Create storage bucket for inspection photos
insert into storage.buckets (id, name, public)
values ('inspection-photos', 'inspection-photos', false);

-- Create storage policies for inspection photos
create policy "Users can upload their own inspection photos"
  on storage.objects for insert
  with check (bucket_id = 'inspection-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can view their own inspection photos"
  on storage.objects for select
  using (bucket_id = 'inspection-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update their own inspection photos"
  on storage.objects for update
  using (bucket_id = 'inspection-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete their own inspection photos"
  on storage.objects for delete
  using (bucket_id = 'inspection-photos' and auth.uid()::text = (storage.foldername(name))[1]);
