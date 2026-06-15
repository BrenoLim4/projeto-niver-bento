// Cliente Supabase compartilhado (ESM via CDN, sem build/bundler).
//
// Projeto: Fazendinha do Bento
// Chave usada abaixo: anon/publishable (segura para uso no navegador).
// NUNCA coloque a service role / secret key neste arquivo ou em qualquer
// código que rode no navegador.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://zbfomfbaywbrbaatglsc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_7LPbK7vyDjmX443MXWeeEg_eM0Za_6f';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
