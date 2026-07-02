-- Run with `supabase test db` against a disposable local database.
begin;

create extension if not exists pgtap with schema extensions;
select plan(59);

select results_eq(
  $$select count(*)::int from pg_tables where schemaname='public' and rowsecurity and tablename in
    ('tasks','projects','goals','user_settings','focus_sessions','task_energy_audits','energy_checkins','user_stats','push_subscriptions','processed_mutations','ai_import_usage')$$,
  array[11],
  'RLS is enabled on every user-owned table'
);

select results_eq(
  $$select count(*)::int from pg_policies where schemaname='public' and tablename in
    ('tasks','projects','goals','user_settings','focus_sessions','task_energy_audits','energy_checkins','user_stats','push_subscriptions','processed_mutations','ai_import_usage')$$,
  array[44],
  'Every user-owned table has explicit SELECT, INSERT, UPDATE, and DELETE policies'
);

select results_eq(
  $$select count(*)::int from information_schema.role_table_grants where table_schema='public' and grantee in ('anon','PUBLIC') and table_name in
    ('tasks','projects','goals','user_settings','focus_sessions','task_energy_audits','energy_checkins','user_stats','push_subscriptions','processed_mutations','ai_import_usage')$$,
  array[0],
  'Anonymous role has no privileges on user-owned tables'
);

select results_eq(
  $$select count(*)::int from information_schema.role_table_grants where table_schema='public' and grantee='authenticated' and privilege_type in ('SELECT','INSERT','UPDATE','DELETE') and table_name in
    ('tasks','projects','goals','user_settings','focus_sessions','task_energy_audits','energy_checkins','user_stats','push_subscriptions','processed_mutations','ai_import_usage')$$,
  array[44],
  'Authenticated role has only the expected CRUD table grants'
);

select results_eq(
  $$select count(*)::int from information_schema.role_table_grants where table_schema='public' and grantee='authenticated' and privilege_type not in ('SELECT','INSERT','UPDATE','DELETE') and table_name in
    ('tasks','projects','goals','user_settings','focus_sessions','task_energy_audits','energy_checkins','user_stats','push_subscriptions','processed_mutations','ai_import_usage')$$,
  array[0],
  'Authenticated role has no unexpected user-table privileges'
);

insert into auth.users (id, email) values
  ('10000000-0000-0000-0000-000000000001', 'a@example.test'),
  ('20000000-0000-0000-0000-000000000002', 'b@example.test'),
  ('30000000-0000-0000-0000-000000000003', 'c@example.test');

insert into public.goals (id,user_id,name) values
  ('10000000-0000-0000-0001-000000000001','10000000-0000-0000-0000-000000000001','A goal'),
  ('20000000-0000-0000-0001-000000000002','20000000-0000-0000-0000-000000000002','B goal');
insert into public.projects (id,user_id,name) values
  ('10000000-0000-0000-0002-000000000001','10000000-0000-0000-0000-000000000001','A project'),
  ('20000000-0000-0000-0002-000000000002','20000000-0000-0000-0000-000000000002','B project');
insert into public.user_settings(user_id) values ('10000000-0000-0000-0000-000000000001'),('20000000-0000-0000-0000-000000000002');
insert into public.tasks (id,user_id,title) values
  ('10000000-0000-0000-0003-000000000001','10000000-0000-0000-0000-000000000001','A task'),
  ('20000000-0000-0000-0003-000000000002','20000000-0000-0000-0000-000000000002','B task');
insert into public.focus_sessions(id,user_id,task_id,planned_duration_seconds,remaining_seconds) values
  ('10000000-0000-0000-0004-000000000001','10000000-0000-0000-0000-000000000001','10000000-0000-0000-0003-000000000001',1500,1500),
  ('20000000-0000-0000-0004-000000000002','20000000-0000-0000-0000-000000000002','20000000-0000-0000-0003-000000000002',1500,1500);
insert into public.task_energy_audits(id,user_id,task_id,rating) values
  ('10000000-0000-0000-0005-000000000001','10000000-0000-0000-0000-000000000001','10000000-0000-0000-0003-000000000001','neutral'),
  ('20000000-0000-0000-0005-000000000002','20000000-0000-0000-0000-000000000002','20000000-0000-0000-0003-000000000002','neutral');
insert into public.energy_checkins(id,user_id,level) values
  ('10000000-0000-0000-0006-000000000001','10000000-0000-0000-0000-000000000001',3),
  ('20000000-0000-0000-0006-000000000002','20000000-0000-0000-0000-000000000002',3);
insert into public.user_stats(user_id) values ('10000000-0000-0000-0000-000000000001'),('20000000-0000-0000-0000-000000000002') on conflict do nothing;
insert into public.push_subscriptions(id,user_id,endpoint,p256dh,auth) values
  ('10000000-0000-0000-0007-000000000001','10000000-0000-0000-0000-000000000001','https://a.test','a','a'),
  ('20000000-0000-0000-0007-000000000002','20000000-0000-0000-0000-000000000002','https://b.test','b','b');
insert into public.processed_mutations(id,user_id) values
  ('10000000-0000-0000-0008-000000000001','10000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0008-000000000002','20000000-0000-0000-0000-000000000002');
insert into public.ai_import_usage(user_id,window_started_at) values
  ('10000000-0000-0000-0000-000000000001','2026-06-12T00:00:00Z'),
  ('20000000-0000-0000-0000-000000000002','2026-06-12T00:00:00Z');

set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
select set_config('request.jwt.claim.role','authenticated',true);

select results_eq($$select count(*)::int from public.tasks$$,array[1],'User A reads only own tasks');
select results_eq($$select count(*)::int from public.projects$$,array[1],'User A reads only own projects');
select results_eq($$select count(*)::int from public.goals$$,array[1],'User A reads only own goals');
select results_eq($$select count(*)::int from public.user_settings$$,array[1],'User A reads only own settings');
select results_eq($$select count(*)::int from public.focus_sessions$$,array[1],'User A reads only own focus sessions');
select results_eq($$select count(*)::int from public.task_energy_audits$$,array[1],'User A reads only own audits');
select results_eq($$select count(*)::int from public.energy_checkins$$,array[1],'User A reads only own checkins');
select results_eq($$select count(*)::int from public.user_stats$$,array[1],'User A reads only own stats');
select results_eq($$select count(*)::int from public.push_subscriptions$$,array[1],'User A reads only own push subscriptions');
select results_eq($$select count(*)::int from public.processed_mutations$$,array[1],'User A reads only own processed mutations');
select results_eq($$select count(*)::int from public.ai_import_usage$$,array[1],'User A reads only own AI usage');

select throws_like($$insert into public.tasks(user_id,title) values('20000000-0000-0000-0000-000000000002','cross-user')$$,'%row-level security%','User A cannot insert User B task');
select throws_like($$insert into public.projects(user_id,name) values('20000000-0000-0000-0000-000000000002','cross-user')$$,'%row-level security%','User A cannot insert User B project');
select throws_like($$insert into public.goals(user_id,name) values('20000000-0000-0000-0000-000000000002','cross-user')$$,'%row-level security%','User A cannot insert User B goal');
select throws_like($$insert into public.user_settings(user_id) values('30000000-0000-0000-0000-000000000003')$$,'%row-level security%','User A cannot insert another user settings');
select throws_like($$insert into public.focus_sessions(user_id,planned_duration_seconds,remaining_seconds) values('20000000-0000-0000-0000-000000000002',1500,1500)$$,'%row-level security%','User A cannot insert User B focus session');
select throws_like($$insert into public.task_energy_audits(user_id,task_id,rating) values('20000000-0000-0000-0000-000000000002','20000000-0000-0000-0003-000000000002','neutral')$$,'%row-level security%','User A cannot insert User B audit');
select throws_like($$insert into public.energy_checkins(user_id,level) values('20000000-0000-0000-0000-000000000002',3)$$,'%row-level security%','User A cannot insert User B checkin');
select throws_like($$insert into public.push_subscriptions(user_id,endpoint,p256dh,auth) values('20000000-0000-0000-0000-000000000002','https://cross.test','x','x')$$,'%row-level security%','User A cannot insert User B subscription');
select throws_like($$insert into public.processed_mutations(id,user_id) values('30000000-0000-0000-0008-000000000003','20000000-0000-0000-0000-000000000002')$$,'%row-level security%','User A cannot insert User B mutation');
select throws_like($$insert into public.ai_import_usage(user_id,window_started_at) values('20000000-0000-0000-0000-000000000002','2026-06-12T01:00:00Z')$$,'%row-level security%','User A cannot insert User B AI usage');
select throws_like($$insert into public.user_stats(user_id) values('30000000-0000-0000-0000-000000000003')$$,'%row-level security%','User A cannot insert another user stats');

select throws_like($$update public.tasks set project_id='20000000-0000-0000-0002-000000000002' where id='10000000-0000-0000-0003-000000000001'$$,'%same user%','User A task cannot link to User B project');
select throws_like($$update public.tasks set goal_id='20000000-0000-0000-0001-000000000002' where id='10000000-0000-0000-0003-000000000001'$$,'%same user%','User A task cannot link to User B goal');
select throws_like($$update public.tasks set recurrence_parent_id='20000000-0000-0000-0003-000000000002' where id='10000000-0000-0000-0003-000000000001'$$,'%same user%','User A task cannot link to User B recurrence parent');
select throws_like($$update public.projects set goal_id='20000000-0000-0000-0001-000000000002' where id='10000000-0000-0000-0002-000000000001'$$,'%same user%','User A project cannot link to User B goal');
select throws_like($$insert into public.focus_sessions(user_id,task_id,planned_duration_seconds,remaining_seconds) values('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0003-000000000002',1500,1500)$$,'%same user%','User A focus session cannot link to User B task');
select throws_like($$insert into public.task_energy_audits(user_id,task_id,rating) values('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0003-000000000002','neutral')$$,'%same user%','User A audit cannot link to User B task');

select results_eq($$select has_function_privilege('authenticated','public.refresh_user_stats(uuid)','EXECUTE')$$,array[false],'Authenticated users cannot execute stats maintenance');
select results_eq($$select has_function_privilege('authenticated','public.tasks_refresh_stats_trigger()','EXECUTE')$$,array[false],'Authenticated users cannot execute stats trigger function');
select results_eq($$select has_function_privilege('authenticated','public.enforce_owned_relationships()','EXECUTE')$$,array[false],'Authenticated users cannot execute relationship trigger function');
select results_eq($$select has_function_privilege('authenticated','public.set_updated_at()','EXECUTE')$$,array[false],'Authenticated users cannot execute timestamp trigger function');

select results_eq($$with changed as (update public.tasks set title='stolen' where user_id='20000000-0000-0000-0000-000000000002' returning 1) select count(*)::int from changed$$,array[0],'User A cannot update User B task');
select results_eq($$with changed as (update public.projects set name='stolen' where user_id='20000000-0000-0000-0000-000000000002' returning 1) select count(*)::int from changed$$,array[0],'User A cannot update User B project');
select results_eq($$with changed as (update public.goals set name='stolen' where user_id='20000000-0000-0000-0000-000000000002' returning 1) select count(*)::int from changed$$,array[0],'User A cannot update User B goal');
select results_eq($$with changed as (update public.user_settings set display_name='stolen' where user_id='20000000-0000-0000-0000-000000000002' returning 1) select count(*)::int from changed$$,array[0],'User A cannot update User B settings');
select results_eq($$with changed as (update public.focus_sessions set status='cancelled' where user_id='20000000-0000-0000-0000-000000000002' returning 1) select count(*)::int from changed$$,array[0],'User A cannot update User B focus session');
select results_eq($$with changed as (update public.task_energy_audits set rating='draining' where user_id='20000000-0000-0000-0000-000000000002' returning 1) select count(*)::int from changed$$,array[0],'User A cannot update User B audit');
select results_eq($$with changed as (update public.energy_checkins set level=1 where user_id='20000000-0000-0000-0000-000000000002' returning 1) select count(*)::int from changed$$,array[0],'User A cannot update User B checkin');
select results_eq($$with changed as (update public.user_stats set current_streak=99 where user_id='20000000-0000-0000-0000-000000000002' returning 1) select count(*)::int from changed$$,array[0],'User A cannot update User B stats');
select results_eq($$with changed as (update public.push_subscriptions set endpoint='https://stolen.test' where user_id='20000000-0000-0000-0000-000000000002' returning 1) select count(*)::int from changed$$,array[0],'User A cannot update User B subscription');
select results_eq($$with changed as (update public.processed_mutations set processed_at=now() where user_id='20000000-0000-0000-0000-000000000002' returning 1) select count(*)::int from changed$$,array[0],'User A cannot update User B mutation');
select results_eq($$with changed as (update public.ai_import_usage set request_count=99 where user_id='20000000-0000-0000-0000-000000000002' returning 1) select count(*)::int from changed$$,array[0],'User A cannot update User B AI usage');

select results_eq($$with removed as (delete from public.tasks where user_id='20000000-0000-0000-0000-000000000002' returning 1) select count(*)::int from removed$$,array[0],'User A cannot delete User B task');
select results_eq($$with removed as (delete from public.projects where user_id='20000000-0000-0000-0000-000000000002' returning 1) select count(*)::int from removed$$,array[0],'User A cannot delete User B project');
select results_eq($$with removed as (delete from public.goals where user_id='20000000-0000-0000-0000-000000000002' returning 1) select count(*)::int from removed$$,array[0],'User A cannot delete User B goal');
select results_eq($$with removed as (delete from public.user_settings where user_id='20000000-0000-0000-0000-000000000002' returning 1) select count(*)::int from removed$$,array[0],'User A cannot delete User B settings');
select results_eq($$with removed as (delete from public.focus_sessions where user_id='20000000-0000-0000-0000-000000000002' returning 1) select count(*)::int from removed$$,array[0],'User A cannot delete User B focus session');
select results_eq($$with removed as (delete from public.task_energy_audits where user_id='20000000-0000-0000-0000-000000000002' returning 1) select count(*)::int from removed$$,array[0],'User A cannot delete User B audit');
select results_eq($$with removed as (delete from public.energy_checkins where user_id='20000000-0000-0000-0000-000000000002' returning 1) select count(*)::int from removed$$,array[0],'User A cannot delete User B checkin');
select results_eq($$with removed as (delete from public.user_stats where user_id='20000000-0000-0000-0000-000000000002' returning 1) select count(*)::int from removed$$,array[0],'User A cannot delete User B stats');
select results_eq($$with removed as (delete from public.push_subscriptions where user_id='20000000-0000-0000-0000-000000000002' returning 1) select count(*)::int from removed$$,array[0],'User A cannot delete User B subscription');
select results_eq($$with removed as (delete from public.processed_mutations where user_id='20000000-0000-0000-0000-000000000002' returning 1) select count(*)::int from removed$$,array[0],'User A cannot delete User B mutation');
select results_eq($$with removed as (delete from public.ai_import_usage where user_id='20000000-0000-0000-0000-000000000002' returning 1) select count(*)::int from removed$$,array[0],'User A cannot delete User B AI usage');

select * from finish();
rollback;
