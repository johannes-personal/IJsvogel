insert into users (email, name, party, role)
values
  ('johannes.de.jong@ijsvogelretail.nl', 'IJsvogel Superadmin', 'IJsvogel', 'superadmin'),
  ('anidis@example.com', 'Anidis Gebruiker', 'Anidis', 'party_user'),
  ('nedcargo@example.com', 'NedCargo Gebruiker', 'NedCargo', 'party_user')
on conflict (email) do nothing;

insert into client_map (client_number, client_name)
values
  ('1001', 'Klant Amsterdam'),
  ('2002', 'Klant Rotterdam')
on conflict (client_number) do nothing;

insert into notification_settings (event_code, enabled)
values
  ('on_submission', true),
  ('on_status_update', true)
on conflict (event_code) do nothing;

insert into notification_recipients (event_code, email)
values
  ('on_submission', 'johannes.de.jong@ijsvogelretail.nl'),
  ('on_status_update', 'johannes.de.jong@ijsvogelretail.nl');

insert into cases (id, type, submitted_by, client_number, client_name, from_date, to_date, comment, status, decided_on, decision_comment)
values
  ('11111111-1111-4111-8111-111111111111', 'Routeafwijking', 'Anidis', '1001', 'Klant Amsterdam', '2026-04-14', '2026-04-16', 'Levering moet 2 dagen later vertrekken door voorraadcorrectie.', 'Pending', null, null),
  ('22222222-2222-4222-8222-222222222222', 'Routeafwijking', 'NedCargo', '2002', 'Klant Rotterdam', '2026-04-10', '2026-04-12', 'Route via Breda voorgesteld vanwege wegwerkzaamheden.', 'Approved', now() - interval '2 days', 'Akkoord, planning is aangepast.'),
  ('33333333-3333-4333-8333-333333333333', 'Palletafwijking', 'NedCargo', '1001', 'Klant Amsterdam', null, null, 'Ontvangst toont 3 pallets minder dan vrachtbrief.', 'Wijziging voorgesteld', now() - interval '12 hours', 'Graag foto van laadlijst toevoegen.'),
  ('44444444-4444-4444-8444-444444444444', 'Palletafwijking', 'Anidis', '2002', 'Klant Rotterdam', null, null, 'Twee pallets met transportschade geconstateerd.', 'Rejected', now() - interval '3 days', 'Schade niet aantoonbaar bij overdracht.'),
  ('55555555-5555-4555-8555-555555555555', 'Ander', 'Anidis', null, null, null, null, 'Losdock was niet beschikbaar binnen afgesproken tijdslot.', 'Pending', null, null)
on conflict (id) do nothing;
