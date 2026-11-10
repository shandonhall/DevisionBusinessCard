-- Apple Wallet pass downloads, and opens from the QR code printed on the pass.
alter type public.card_analytics_event_type
  add value if not exists 'wallet_pass_download';

alter type public.card_analytics_source
  add value if not exists 'wallet';
