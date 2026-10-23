
/* CampusOS Cloud Sync
   Keeps the existing campusos.data.v1 storage key.
   No automatic sync, merge, or overwrite.
*/
(() => {
  "use strict";

  const STORAGE_KEY = "campusos.data.v1";
  const BACKUP_KEY = "campusos.precloud.backup.v1";
  const CONFIG_KEY = "campusos.supabase.config.v1";

  // Add your Supabase Project URL and publishable key in Step 2.
  const SUPABASE_URL = "https://gqkgxbbbytzglsmrfofr.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_1XMbhNlZ2N7XbYuS9KkqBQ_kZ5-0X5n";

  const style = document.createElement("style");
  style.textContent = `
    #campusos-cloud-panel {
      position: fixed; right: 18px; bottom: 18px; z-index: 99999;
      width: min(390px, calc(100vw - 28px)); max-height: 82vh;
      overflow: auto; background: #fff; color: #172033;
      border: 1px solid #dce3ee; border-radius: 18px;
      box-shadow: 0 18px 60px #0b18352b;
      font: 14px/1.45 system-ui, sans-serif;
    }
    #campusos-cloud-panel * { box-sizing: border-box; }
    #campusos-cloud-panel .cs-head {
      padding: 16px; background: #f5f8fc; border-radius: 18px 18px 0 0;
      border-bottom: 1px solid #e3e8f0;
    }
    #campusos-cloud-panel h2 { margin: 0 0 4px; font-size: 17px; }
    #campusos-cloud-panel p { margin: 6px 0 12px; color: #596579; }
    #campusos-cloud-panel .cs-body { padding: 16px; }
    #campusos-cloud-panel label {
      display: block; margin: 10px 0 5px; font-weight: 600;
    }
    #campusos-cloud-panel input {
      width: 100%; padding: 10px 11px; border: 1px solid #cbd5e1;
      border-radius: 9px; background: #fff; color: #172033;
      font: inherit; min-width: 0;
    }
    #campusos-cloud-panel button {
      border: 0; border-radius: 9px; padding: 10px 12px;
      font: inherit; font-weight: 650; cursor: pointer;
      background: #e9eef7; color: #172033; margin: 4px 4px 4px 0;
    }
    #campusos-cloud-panel button.cs-primary { background: #172033; color: #fff; }
    #campusos-cloud-panel button.cs-danger { background: #fff0f0; color: #a21d2d; }
    #campusos-cloud-panel button:disabled { opacity: .5; cursor: wait; }
    #campusos-cloud-panel .cs-status {
      background: #f5f8fc; border-radius: 9px; padding: 10px;
      margin: 10px 0; overflow-wrap: anywhere;
    }
    #campusos-cloud-panel .cs-hidden { display: none !important; }
    #campusos-cloud-panel .cs-actions { display: flex; flex-wrap: wrap; gap: 4px; }
    #campusos-cloud-panel .cs-small { font-size: 12px; color: #667085; }
    #campusos-cloud-toggle {
      position: fixed; right: 18px; bottom: 18px; z-index: 99998;
      border: 0; border-radius: 999px; padding: 13px 17px;
      color: white; background: #172033; box-shadow: 0 8px 28px #0b18352b;
      font: 650 14px system-ui, sans-serif; cursor: pointer;
    }
  `;
  document.head.appendChild(style);

  const toggle = document.createElement("button");
  toggle.id = "campusos-cloud-toggle";
  toggle.type = "button";
  toggle.textContent = "☁ Cloud Sync";
  document.body.appendChild(toggle);

  const panel = document.createElement("section");
  panel.id = "campusos-cloud-panel";
  panel.classList.add("cs-hidden");
  panel.setAttribute("aria-label", "CampusOS Cloud Sync");
  panel.innerHTML = `
    <div class="cs-head">
      <h2>CampusOS Cloud Sync</h2>
      <div class="cs-small">Manual sync only · Your data stays local until you choose an action.</div>
    </div>
    <div class="cs-body">
      <div id="cs-status" class="cs-status" role="status" aria-live="polite">
        Checking configuration…
      </div>

      <div id="cs-auth">
        <label for="cs-email">Email</label>
        <input id="cs-email" type="email" autocomplete="email"
               placeholder="you@example.com">
        <label for="cs-password">Password</label>
        <input id="cs-password" type="password"
               autocomplete="current-password" placeholder="Use a strong password">
        <div class="cs-actions" style="margin-top:10px">
          <button id="cs-sign-in" class="cs-primary" type="button">Sign in</button>
          <button id="cs-sign-up" type="button">Create account</button>
        </div>
        <p class="cs-small">
          Use the same account on both devices. Never share your password.
        </p>
      </div>

      <div id="cs-account" class="cs-hidden">
        <div id="cs-user" class="cs-small"></div>
        <div class="cs-actions">
          <button id="cs-upload" class="cs-primary" type="button">
            Upload local data
          </button>
          <button id="cs-download" type="button">Preview cloud data</button>
          <button id="cs-sign-out" type="button">Sign out</button>
        </div>
        <p class="cs-small">
          Upload replaces this account's cloud snapshot. Download can replace
          local data only after a separate confirmation. Neither happens automatically.
        </p>
      </div>

      <div class="cs-actions" style="margin-top:12px">
        <button id="cs-close" type="button">Close</button>
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  const $ = selector => panel.querySelector(selector);
  const statusEl = $("#cs-status");
  const authArea = $("#cs-auth");
  const accountArea = $("#cs-account");

  function setStatus(message) {
    statusEl.textContent = message;
  }

  function setBusy(busy) {
    panel.querySelectorAll("button").forEach(button => {
      if (button.id !== "cs-close" && button.id !== "campusos-cloud-toggle") {
        button.disabled = busy;
      }
    });
  }

  function showSignedIn(session) {
    const signedIn = !!session?.user;
    authArea.classList.toggle("cs-hidden", signedIn);
    accountArea.classList.toggle("cs-hidden", !signedIn);
    $("#cs-user").textContent = signedIn
      ? `Signed in as ${session.user.email || session.user.id}`
      : "";
  }

  function localSnapshot() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      throw new Error(
        "No CampusOS data was found in this browser. Open your existing dashboard first."
      );
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Local CampusOS data has an unexpected format. Nothing was changed.");
    }

    return { raw, parsed };
  }

  function downloadJson(filename, value) {
    const blob = new Blob([value], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  }

  function summary(data) {
    const counts = [];
    for (const key of ["subjects", "attendance", "tasks", "exams", "timetable", "extraEvents"]) {
      if (Array.isArray(data?.[key])) counts.push(`${key}: ${data[key].length}`);
    }
    return counts.length ? counts.join(" · ") : "Data structure detected; detailed counts unavailable.";
  }

  function getClient() {
    if (!window.supabase || typeof window.supabase.createClient !== "function") {
      throw new Error("Supabase SDK did not load. Check your internet connection and script tags.");
    }

    if (
      !SUPABASE_URL.startsWith("https://") ||
      SUPABASE_URL.includes("PASTE_YOUR_") ||
      !SUPABASE_PUBLISHABLE_KEY ||
      SUPABASE_PUBLISHABLE_KEY.includes("PASTE_YOUR_")
    ) {
      throw new Error("Add your Supabase Project URL and publishable key inside cloud-sync.js first.");
    }

    let client = window.__campusosSupabaseClient;
    if (!client) {
      client = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        }
      );
      window.__campusosSupabaseClient = client;
    }
    return client;
  }

  async function signedInUser(client) {
    const { data, error } = await client.auth.getUser();
    if (error) throw error;
    if (!data.user) throw new Error("Please sign in first.");
    return data.user;
  }

  async function refreshSessionUI() {
    try {
      const client = getClient();
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      showSignedIn(data.session);
      setStatus(data.session
        ? "Signed in. Choose upload or preview cloud data when you're ready."
        : "Ready. Sign in to use cloud sync.");
    } catch (error) {
      showSignedIn(null);
      setStatus(error.message || String(error));
    }
  }

  async function runAction(action) {
    setBusy(true);
    try {
      await action();
    } catch (error) {
      console.error("CampusOS cloud sync error:", error);
      setStatus(error?.message || "The operation failed. Local data was not intentionally changed.");
    } finally {
      setBusy(false);
      await refreshSessionUI();
    }
  }

  async function signIn() {
    const email = $("#cs-email").value.trim();
    const password = $("#cs-password").value;
    if (!email || !password) throw new Error("Enter your email and password.");

    const client = getClient();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;

    showSignedIn(data.session);
    setStatus("Signed in successfully.");
  }

  async function signUp() {
    const email = $("#cs-email").value.trim();
    const password = $("#cs-password").value;
    if (!email || !password) throw new Error("Enter your email and password.");
    if (password.length < 10) {
      throw new Error("Use a password of at least 10 characters.");
    }

    const client = getClient();
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + window.location.pathname
      }
    });
    if (error) throw error;

    if (data.session) {
      showSignedIn(data.session);
      setStatus("Account created and signed in.");
    } else {
      setStatus("Account created. Check your email to confirm the account, then sign in.");
    }
  }

  async function uploadLocal() {
    const client = getClient();
    const user = await signedInUser(client);
    const { raw, parsed } = localSnapshot();

    const ok = window.confirm(
      "UPLOAD LOCAL DATA TO CLOUD?\n\n" +
      "This uploads the current browser's CampusOS snapshot to your account.\n" +
      "If a cloud snapshot already exists, it will be replaced.\n\n" +
      "Local data will not be deleted or replaced.\n\n" +
      "Current data: " + summary(parsed) + "\n\n" +
      "Continue?"
    );
    if (!ok) {
      setStatus("Upload cancelled. Nothing was changed.");
      return;
    }

    // Keep an additional local snapshot before any cloud write.
    localStorage.setItem(BACKUP_KEY, raw);

    // Download a separate backup file before sending data to cloud.
    downloadJson(
      `campusos-before-cloud-upload-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
      raw
    );

    setStatus("Uploading…");
    const { error } = await client
      .from("campusos_cloud")
      .upsert({
        user_id: user.id,
        data: parsed,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });

    if (error) throw error;
    setStatus("Upload successful. Local data is unchanged. A backup was downloaded.");
  }

  async function previewCloud() {
    const client = getClient();
    const user = await signedInUser(client);

    setStatus("Checking cloud snapshot…");
    const { data: row, error } = await client
      .from("campusos_cloud")
      .select("data, updated_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;
    if (!row) {
      setStatus("No cloud snapshot exists for this account yet. Upload local data first.");
      return;
    }

    if (!row.data || typeof row.data !== "object" || Array.isArray(row.data)) {
      throw new Error("Cloud data format is unexpected. Local data was not changed.");
    }

    const cloudRaw = JSON.stringify(row.data, null, 2);
    downloadJson(
      `campusos-cloud-preview-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
      cloudRaw
    );

    const updated = row.updated_at
      ? new Date(row.updated_at).toLocaleString()
      : "unknown time";

    const local = localSnapshot();

    const confirmText =
      "CLOUD SNAPSHOT FOUND\n\n" +
      "Last cloud update: " + updated + "\n" +
      "Cloud data: " + summary(row.data) + "\n\n" +
      "Your current local data: " + summary(local.parsed) + "\n\n" +
      "A JSON file containing the cloud snapshot has been downloaded for review.\n" +
      "Do you want to REPLACE this browser's local CampusOS data with the cloud snapshot?\n\n" +
      "This will not merge records. A local backup will be saved first, and the page will reload only after you confirm.";

    if (!window.confirm(confirmText)) {
      setStatus("Preview complete. Downloaded cloud JSON for review. Local data was not changed.");
      return;
    }

    const confirmAgain = window.confirm(
      "FINAL CONFIRMATION\n\n" +
      "Replace all local CampusOS data in this browser with the cloud snapshot now?\n\n" +
      "Choose Cancel to keep the current local data."
    );

    if (!confirmAgain) {
      setStatus("Replacement cancelled. Local data was not changed.");
      return;
    }

    // Back up current raw local data before replacing it.
    localStorage.setItem(BACKUP_KEY, local.raw);
    downloadJson(
      `campusos-before-cloud-download-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
      local.raw
    );

    // Validate serialization before the one intentional replacement.
    const replacement = JSON.stringify(row.data);
    JSON.parse(replacement);

    localStorage.setItem(STORAGE_KEY, replacement);
    setStatus("Cloud data applied. Reloading CampusOS…");
    window.location.reload();
  }

  toggle.addEventListener("click", () => {
    panel.classList.toggle("cs-hidden");
    if (!panel.classList.contains("cs-hidden")) refreshSessionUI();
  });

  $("#cs-close").addEventListener("click", () => panel.classList.add("cs-hidden"));
  $("#cs-sign-in").addEventListener("click", () => runAction(signIn));
  $("#cs-sign-up").addEventListener("click", () => runAction(signUp));
  $("#cs-upload").addEventListener("click", () => runAction(uploadLocal));
  $("#cs-download").addEventListener("click", () => runAction(previewCloud));

  $("#cs-sign-out").addEventListener("click", () => runAction(async () => {
    const client = getClient();
    const { error } = await client.auth.signOut();
    if (error) throw error;
    showSignedIn(null);
    setStatus("Signed out. Local CampusOS data remains on this device.");
  }));

  // Validate local data without changing it and initialize the panel.
  try {
    localSnapshot();
  } catch (error) {
    setStatus(error.message);
  }

  refreshSessionUI();
})();
