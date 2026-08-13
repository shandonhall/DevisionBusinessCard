-- Record when the vCard file is actually requested (not only the button tap).
alter type public.card_analytics_event_type
  add value if not exists 'vcard_download';
