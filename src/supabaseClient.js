import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://cqfyqsqybxbcvgosqldb.supabase.co";
const supabaseKey = "sb_publishable_25dvQ_vt1RLAJbIHBXI6ZA_pNZztoHe";

export const supabase = createClient(supabaseUrl, supabaseKey);
