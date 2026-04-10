// supabaseClient.js
// supabaseClient.js
// Make sure this file is included as <script type="module" src="supabaseClient.js"></script>

import { createClient } from "https://esm.sh/@supabase/supabase-js";

window.supabase = createClient(
  "https://zhcjiugauqzzxzwamrwm.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoY2ppdWdhdXF6enh6d2FtcndtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNTk4MjQsImV4cCI6MjA5MDkzNTgyNH0.XNBLG2HT0CC23M1iaMvPbiKv-PQIZRSAXaCL-7Was9U"
);
console.log("supabase ready")
export const supabase = window.supabase




export class AuthSetup {
  async createUser(email, password) {
    let status = { loading: true, success: false, error: null, data: null };
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      status.loading = false;
      if (error) { status.error = error.message; return status; }
      status.success = true;
      status.data = data;
      return status;
    } catch (err) {
      status.loading = false;
      status.error = err.message || "Unexpected error";
      return status;
    }
  }

  async signIn(email, password) {
    let status = { loading: true, success: false, error: null, data: null };
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      status.loading = false;
      if (error) { status.error = error.message; return status; }
      status.success = true;
      status.data = data;
      return status;
    } catch (err) {
      status.loading = false;
      status.error = err.message || "Unexpected error";
      return status;
    }
  }
}
