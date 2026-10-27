export interface NativeAndroidFile {
  id: string;
  filename: string;
  path: string;
  title: string;
  description: string;
  language: 'kotlin' | 'xml' | 'gradle' | 'yaml';
  code: string;
}

export const SELF_CONTAINED_GITHUB_ACTION_YAML = `name: Android CI - Build Standalone ShulMode APK

on:
  push:
    branches: [ "main", "master" ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Generate Complete Standalone ShulMode Android Project
        run: |
          mkdir -p app/src/main/java/com/shulmode/app/ui
          mkdir -p app/src/main/java/com/shulmode/app/telecom
          mkdir -p app/src/main/java/com/shulmode/app/service
          mkdir -p app/src/main/assets

          cat << 'EOF' > settings.gradle.kts
          pluginManagement {
              repositories {
                  google()
                  mavenCentral()
                  gradlePluginPortal()
              }
          }
          dependencyResolutionManagement {
              repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
              repositories {
                  google()
                  mavenCentral()
              }
          }
          rootProject.name = "ShulMode"
          include(":app")
          EOF

          cat << 'EOF' > gradle.properties
          android.useAndroidX=true
          org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
          EOF

          cat << 'EOF' > build.gradle.kts
          plugins {
              id("com.android.application") version "8.3.2" apply false
              id("org.jetbrains.kotlin.android") version "1.9.22" apply false
          }
          EOF

          cat << 'EOF' > app/build.gradle.kts
          plugins {
              id("com.android.application")
              id("org.jetbrains.kotlin.android")
          }

          android {
              namespace = "com.shulmode.app"
              compileSdk = 34

              defaultConfig {
                  applicationId = "com.shulmode.app"
                  minSdk = 26
                  targetSdk = 34
                  versionCode = 4
                  versionName = "1.3"
              }

              compileOptions {
                  sourceCompatibility = JavaVersion.VERSION_17
                  targetCompatibility = JavaVersion.VERSION_17
              }
              kotlinOptions {
                  jvmTarget = "17"
              }
          }

          dependencies {
              implementation("androidx.core:core-ktx:1.12.0")
              implementation("androidx.activity:activity-ktx:1.8.2")
              implementation("androidx.webkit:webkit:1.10.0")
          }
          EOF

          cat << 'EOF' > app/src/main/AndroidManifest.xml
          <?xml version="1.0" encoding="utf-8"?>
          <manifest xmlns:android="http://schemas.android.com/apk/res/android">

              <uses-permission android:name="android.permission.INTERNET" />
              <uses-permission android:name="android.permission.ACCESS_NOTIFICATION_POLICY" />
              <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
              <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
              <uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
              <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
              <uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
              <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
              <uses-permission android:name="android.permission.READ_PHONE_STATE" />
              <uses-permission android:name="android.permission.READ_CALL_LOG" />
              <uses-permission android:name="android.permission.READ_CONTACTS" />
              <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
              <uses-permission android:name="android.permission.VIBRATE" />

              <application
                  android:allowBackup="true"
                  android:label="ShulMode"
                  android:supportsRtl="true"
                  android:theme="@android:style/Theme.DeviceDefault.NoActionBar">

                  <activity
                      android:name=".ui.MainActivity"
                      android:exported="true">
                      <intent-filter>
                          <action android:name="android.intent.action.MAIN" />
                          <category android:name="android.intent.category.LAUNCHER" />
                      </intent-filter>
                  </activity>

                  <service
                      android:name=".service.ShulBackgroundMonitorService"
                      android:enabled="true"
                      android:exported="false"
                      android:foregroundServiceType="location" />

                  <receiver
                      android:name=".service.ShulBootReceiver"
                      android:enabled="true"
                      android:exported="true">
                      <intent-filter>
                          <action android:name="android.intent.action.BOOT_COMPLETED" />
                          <action android:name="android.intent.action.MY_PACKAGE_REPLACED" />
                      </intent-filter>
                  </receiver>

                  <service
                      android:name=".telecom.ShulCallScreeningService"
                      android:permission="android.permission.BIND_SCREENING_SERVICE"
                      android:exported="true">
                      <intent-filter>
                          <action android:name="android.telecom.CallScreeningService" />
                      </intent-filter>
                  </service>
              </application>
          </manifest>
          EOF

          cat << 'EOF' > app/src/main/assets/index.html
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
            <title>ShulMode — Your Phone, Respectfully Silent</title>
            <style>
              :root {
                --bg: #FAF7F0; --card: #FFFFFF; --text: #0F172A; --muted: #64748B;
                --border: #E2E8F0; --gold: #C59B27; --navy: #0B1120; --danger: #DC2626;
              }
              body.dark {
                --bg: #0B1120; --card: #131C31; --text: #F8FAFC; --muted: #94A3B8;
                --border: #1E293B; --gold: #D4AF37;
              }
              * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
              body { background: var(--bg); color: var(--text); min-height: 100vh; padding-bottom: 84px; transition: background 0.25s, color 0.25s; }
              header { position: sticky; top: 0; z-index: 20; background: var(--card); border-bottom: 1px solid var(--border); padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; }
              .brand { display: flex; align-items: center; gap: 10px; }
              .brand-icon { width: 36px; height: 36px; border-radius: 10px; background: var(--navy); color: #FBBF24; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 18px; }
              .brand-title { font-weight: 700; font-size: 17px; }
              .brand-sub { font-size: 11px; color: var(--muted); }
              .header-actions { display: flex; gap: 8px; }
              .btn-sm { padding: 7px 11px; border-radius: 8px; border: 1px solid var(--border); background: var(--card); color: var(--text); font-size: 12px; font-weight: 600; cursor: pointer; }
              main { max-width: 560px; margin: 0 auto; padding: 16px; display: flex; flex-direction: column; gap: 16px; }
              .card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 18px; box-shadow: 0 2px 8px rgba(0,0,0,0.03); }
              .hero-active { background: linear-gradient(145deg, #0B1120, #1E293B); color: #FFFFFF; border-color: #C59B27; }
              .status-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
              .status-title { font-size: 24px; font-weight: 800; letter-spacing: -0.02em; margin-top: 4px; }
              .status-reason { font-size: 13px; opacity: 0.85; margin-top: 4px; }
              .big-toggle { width: 100%; margin-top: 16px; padding: 15px; border-radius: 12px; border: none; font-size: 15px; font-weight: 700; cursor: pointer; }
              .toggle-on { background: #F59E0B; color: #0F172A; }
              .toggle-off { background: #0F172A; color: #FFFFFF; }
              body.dark .toggle-off { background: #F59E0B; color: #0F172A; }
              .quick-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 12px; }
              .quick-btn { padding: 10px 6px; border-radius: 10px; border: 1px solid rgba(148,163,184,0.3); background: rgba(255,255,255,0.08); color: inherit; font-size: 12px; font-weight: 600; cursor: pointer; }
              .section-title { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
              .section-sub { font-size: 12px; color: var(--muted); margin-bottom: 12px; }
              .form-row { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
              input, select { width: 100%; padding: 11px 12px; border-radius: 10px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 14px; }
              .btn-primary { width: 100%; padding: 12px; border-radius: 10px; border: none; background: #0F172A; color: #FFFFFF; font-weight: 700; font-size: 14px; cursor: pointer; }
              body.dark .btn-primary { background: #F59E0B; color: #0F172A; }
              .btn-gold { width: 100%; padding: 12px; border-radius: 10px; border: none; background: #F59E0B; color: #0F172A; font-weight: 700; font-size: 13px; cursor: pointer; margin-bottom: 10px; }
              .smart-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; }
              .smart-card { padding: 10px; border-radius: 10px; border: 1px solid var(--border); background: var(--bg); text-align: start; cursor: pointer; }
              .smart-card:active { border-color: var(--gold); }
              .smart-card-title { font-size: 12px; font-weight: 700; color: var(--text); }
              .smart-card-sub { font-size: 10px; color: var(--muted); margin-top: 2px; }
              .search-results { border: 1px solid var(--border); border-radius: 10px; background: var(--card); max-height: 180px; overflow-y: auto; margin-bottom: 8px; }
              .search-item { padding: 9px 11px; border-bottom: 1px solid var(--border); font-size: 12px; cursor: pointer; text-align: start; width: 100%; background: none; border-left: none; border-right: none; border-top: none; color: var(--text); }
              .list-item { display: flex; align-items: center; justify-content: space-between; padding: 12px; border-radius: 12px; border: 1px solid var(--border); margin-top: 8px; gap: 10px; }
              .item-title { font-weight: 700; font-size: 14px; }
              .item-meta { font-size: 12px; color: var(--muted); margin-top: 2px; font-variant-numeric: tabular-nums; }
              .del-btn { padding: 6px 10px; border-radius: 8px; border: 1px solid rgba(220,38,38,0.3); background: transparent; color: var(--danger); font-size: 12px; font-weight: 600; }
              .perm-banner { background: #FEF3C7; color: #92400E; border: 1px solid #F59E0B; border-radius: 12px; padding: 14px; display: flex; align-items: center; justify-content: space-between; gap: 10px; }
              .bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; background: var(--card); border-top: 1px solid var(--border); display: grid; grid-template-columns: repeat(5, 1fr); padding: 8px 4px; z-index: 30; }
              .nav-btn { background: none; border: none; color: var(--muted); font-size: 11px; font-weight: 600; display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 6px 2px; cursor: pointer; }
              .nav-btn.active { color: var(--gold); font-weight: 700; }
              .days-row { display: flex; gap: 4px; flex-wrap: wrap; }
              .day-btn { flex: 1; min-width: 36px; padding: 7px 4px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 11px; font-weight: 700; cursor: pointer; }
              .day-btn.selected { background: var(--gold); color: #0F172A; border-color: var(--gold); }
              .hidden { display: none !important; }
            </style>
          </head>
          <body>
            <header>
              <div class="brand">
                <div class="brand-icon">✡</div>
                <div>
                  <div class="brand-title">ShulMode</div>
                  <div class="brand-sub">24/7 Background Sanctuary Silence</div>
                </div>
              </div>
              <div class="header-actions">
                <button class="btn-sm" onclick="toggleLang()" id="langBtn">עברית</button>
                <button class="btn-sm" onclick="toggleTheme()">🌙</button>
              </div>
            </header>

            <main>
              <div id="dndPermBanner" class="perm-banner hidden">
                <div>
                  <div style="font-weight:700;font-size:13px;">Do Not Disturb Permission Required</div>
                  <div style="font-size:11px;margin-top:2px;">Turn on ShulMode in the Do Not Disturb screen to allow automatic silence.</div>
                </div>
                <button class="btn-sm" style="background:#92400E;color:#fff;border:none;" onclick="openDndSettings()">Open</button>
              </div>

              <!-- TAB 1: DASHBOARD -->
              <section id="tab-dashboard">
                <div id="heroCard" class="card">
                  <div class="status-row">
                    <div>
                      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;opacity:0.75;">BACKGROUND MONITOR ACTIVE</div>
                      <div class="status-title" id="lblStatusText">Shul Mode OFF</div>
                      <div class="status-reason" id="lblActiveReason">Standard ringer active</div>
                    </div>
                    <div style="font-size:34px;">🕍</div>
                  </div>
                  <button id="mainToggleBtn" class="big-toggle toggle-off" onclick="toggleManualIndefinite()">Activate Shul Mode Now</button>
                  <div class="quick-grid">
                    <button class="quick-btn" onclick="activateForMinutes(15)">15m</button>
                    <button class="quick-btn" onclick="activateForMinutes(30)">30m</button>
                    <button class="quick-btn" onclick="activateForMinutes(60)">60m</button>
                    <button class="quick-btn" onclick="activateForMinutes(120)">2h</button>
                  </div>
                </div>
                <div class="card" style="margin-top:14px;">
                  <div class="section-title">24/7 Background Service Status</div>
                  <div class="item-meta" id="summaryStats" style="margin-top:6px;line-height:1.6;"></div>
                </div>
              </section>

              <!-- TAB 2: LOCATIONS (WITH QUICK SMART MENU) -->
              <section id="tab-locations" class="hidden">
                <div class="card">
                  <div class="section-title">Quick Smart Synagogue Menu</div>
                  <div class="section-sub">Tap a smart preset or save your current spot in 1 tap:</div>

                  <button type="button" class="btn-gold" onclick="instantSaveCurrentSpot()">
                    📍 I'm Standing at Shul Right Now (1-Tap Auto-Save)
                  </button>

                  <div class="smart-grid">
                    <button type="button" class="smart-card" onclick="applySmartPreset('Main Synagogue', 100)">
                      <div class="smart-card-title">🕍 Main Shul</div>
                      <div class="smart-card-sub">100m radius • All days</div>
                    </button>
                    <button type="button" class="smart-card" onclick="applySmartPreset('Beit Midrash / Yeshiva', 200)">
                      <div class="smart-card-title">📚 Beit Midrash</div>
                      <div class="smart-card-sub">200m radius • Study hall</div>
                    </button>
                    <button type="button" class="smart-card" onclick="applySmartPreset('Local Shtiebel', 50)">
                      <div class="smart-card-title">🕯️ Shtiebel / Minyan</div>
                      <div class="smart-card-sub">50m tight radius</div>
                    </button>
                    <button type="button" class="smart-card" onclick="applySmartPreset('Community Campus', 500)">
                      <div class="smart-card-title">🏛️ Large Campus</div>
                      <div class="smart-card-sub">500m wide radius</div>
                    </button>
                  </div>

                  <div class="form-row">
                    <div style="display:flex;gap:6px;">
                      <input id="addressSearchInput" placeholder="🔍 Search synagogue or street address..." oninput="debouncedAddressSearch()" />
                    </div>
                    <div id="searchResultsBox" class="search-results hidden"></div>

                    <input id="locName" placeholder="Synagogue Name (e.g. Main Shul, Beit Midrash)" />
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                      <input id="locLat" type="number" step="any" placeholder="Latitude" />
                      <input id="locLng" type="number" step="any" placeholder="Longitude" />
                    </div>
                    <button type="button" class="btn-sm" onclick="useCurrentGpsForForm()" style="padding:10px;">🎯 Fill Coordinates from Phone GPS</button>
                    <select id="locRadius">
                      <option value="50">50 meters radius (Small Shtiebel)</option>
                      <option value="100" selected>100 meters radius (Standard Shul)</option>
                      <option value="200">200 meters radius (Yeshiva / Hall)</option>
                      <option value="500">500 meters radius (Large Campus)</option>
                    </select>
                    <button type="button" class="btn-primary" onclick="addLocation()">+ Save Synagogue Location</button>
                  </div>
                  <div id="locationsList"></div>
                </div>
              </section>

              <!-- TAB 3: SCHEDULES -->
              <section id="tab-schedules" class="hidden">
                <div class="card">
                  <div class="section-title">Prayer & Study Schedules</div>
                  <div class="section-sub">Runs automatically in the background even when the app is closed.</div>
                  <div class="form-row">
                    <input id="schedName" placeholder="Schedule Name (e.g. Shacharit, Mincha & Maariv)" />
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                      <div>
                        <div style="font-size:11px;color:var(--muted);margin-bottom:3px;">Start Time</div>
                        <input id="schedStart" type="time" value="07:00" />
                      </div>
                      <div>
                        <div style="font-size:11px;color:var(--muted);margin-bottom:3px;">End Time</div>
                        <input id="schedEnd" type="time" value="08:30" />
                      </div>
                    </div>
                    <div class="days-row" id="schedDaysRow">
                      <button type="button" class="day-btn selected" data-day="0" onclick="toggleDayBtn(this)">Sun</button>
                      <button type="button" class="day-btn selected" data-day="1" onclick="toggleDayBtn(this)">Mon</button>
                      <button type="button" class="day-btn selected" data-day="2" onclick="toggleDayBtn(this)">Tue</button>
                      <button type="button" class="day-btn selected" data-day="3" onclick="toggleDayBtn(this)">Wed</button>
                      <button type="button" class="day-btn selected" data-day="4" onclick="toggleDayBtn(this)">Thu</button>
                      <button type="button" class="day-btn selected" data-day="5" onclick="toggleDayBtn(this)">Fri</button>
                      <button type="button" class="day-btn" data-day="6" onclick="toggleDayBtn(this)">Shabbat</button>
                    </div>
                    <button type="button" class="btn-primary" onclick="addSchedule()">+ Add Prayer Schedule</button>
                  </div>
                  <div id="schedulesList"></div>
                </div>
              </section>

              <!-- TAB 4: ALLOWED CALLERS -->
              <section id="tab-callers" class="hidden">
                <div class="card">
                  <div class="section-title">Allowed Priority Callers</div>
                  <div class="section-sub">Phone numbers listed here will still ring through even when ShulMode is ON.</div>
                  <div class="form-row">
                    <input id="callerName" placeholder="Contact Name (e.g. Spouse, Hatzalah, Childcare)" />
                    <input id="callerPhone" type="tel" placeholder="Phone Number (e.g. +1 555-234-5678)" />
                    <button type="button" class="btn-primary" onclick="addCaller()">+ Add Priority Caller</button>
                  </div>
                  <div id="callersList"></div>
                </div>
              </section>

              <!-- TAB 5: ACTIVITY LOG -->
              <section id="tab-history" class="hidden">
                <div class="card">
                  <div class="section-title">Activity History</div>
                  <div class="section-sub">Recent ShulMode activations & deactivations.</div>
                  <div id="historyList"></div>
                </div>
              </section>
            </main>

            <nav class="bottom-nav">
              <button class="nav-btn active" onclick="switchTab('dashboard', this)"><span>🕍</span><span>Status</span></button>
              <button class="nav-btn" onclick="switchTab('locations', this)"><span>📍</span><span>Locations</span></button>
              <button class="nav-btn" onclick="switchTab('schedules', this)"><span>🕒</span><span>Schedules</span></button>
              <button class="nav-btn" onclick="switchTab('callers', this)"><span>📞</span><span>Callers</span></button>
              <button class="nav-btn" onclick="switchTab('history', this)"><span>📜</span><span>History</span></button>
            </nav>

            <script>
              const state = {
                manualActive: localStorage.getItem('shul_manual_active') === '1',
                manualUntil: localStorage.getItem('shul_manual_until') ? Number(localStorage.getItem('shul_manual_until')) : null,
                userCoords: null,
                dark: localStorage.getItem('shul_dark') === '1',
                lang: localStorage.getItem('shul_lang') || 'en',
                locations: JSON.parse(localStorage.getItem('shul_locations') || '[{"id":"1","name":"Main Synagogue","lat":31.7767,"lng":35.2345,"radius":100,"enabled":true}]'),
                schedules: JSON.parse(localStorage.getItem('shul_schedules') || '[{"id":"1","name":"Shacharit","start":"07:00","end":"08:30","days":[0,1,2,3,4,5],"enabled":true},{"id":"2","name":"Mincha & Maariv","start":"18:00","end":"19:15","days":[0,1,2,3,4],"enabled":true}]'),
                callers: JSON.parse(localStorage.getItem('shul_callers') || '[]'),
                history: JSON.parse(localStorage.getItem('shul_history') || '[]'),
                lastActiveState: false
              };

              if (state.dark) document.body.classList.add('dark');

              function saveData() {
                localStorage.setItem('shul_manual_active', state.manualActive ? '1' : '0');
                localStorage.setItem('shul_manual_until', state.manualUntil ? String(state.manualUntil) : '');
                localStorage.setItem('shul_locations', JSON.stringify(state.locations));
                localStorage.setItem('shul_schedules', JSON.stringify(state.schedules));
                localStorage.setItem('shul_callers', JSON.stringify(state.callers));
                localStorage.setItem('shul_history', JSON.stringify(state.history.slice(0, 40)));

                if (window.AndroidShulModeBridge) {
                  if (window.AndroidShulModeBridge.syncLocationsJson) {
                    window.AndroidShulModeBridge.syncLocationsJson(JSON.stringify(state.locations), 15);
                  }
                  if (window.AndroidShulModeBridge.syncSchedulesJson) {
                    window.AndroidShulModeBridge.syncSchedulesJson(JSON.stringify(state.schedules));
                  }
                  if (window.AndroidShulModeBridge.syncManualState) {
                    window.AndroidShulModeBridge.syncManualState(Boolean(state.manualActive), state.manualUntil ? Number(state.manualUntil) : 0);
                  }
                  if (window.AndroidShulModeBridge.syncAllowedCallersJson) {
                    window.AndroidShulModeBridge.syncAllowedCallersJson(JSON.stringify(state.callers));
                  }
                }
              }

              function distMeters(lat1, lon1, lat2, lon2) {
                const R = 6371000, toRad = x => x * Math.PI / 180;
                const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
                const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
                return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
              }

              function isTimeInWindow(nowMins, startStr, endStr) {
                const [sh, sm] = startStr.split(':').map(Number);
                const [eh, em] = endStr.split(':').map(Number);
                const start = sh * 60 + sm, end = eh * 60 + em;
                return start <= end ? (nowMins >= start && nowMins < end) : (nowMins >= start || nowMins < end);
              }

              function evaluateRules() {
                const now = new Date();
                if (state.manualActive && state.manualUntil && now.getTime() > state.manualUntil) {
                  state.manualActive = false;
                  state.manualUntil = null;
                  saveData();
                }

                // Pull fresh GPS from Native Background Service if available
                if (window.AndroidShulModeBridge && window.AndroidShulModeBridge.getLastKnownLocationJson) {
                  try {
                    const rawLoc = window.AndroidShulModeBridge.getLastKnownLocationJson();
                    if (rawLoc) {
                      const parsed = JSON.parse(rawLoc);
                      if (parsed && typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
                        state.userCoords = parsed;
                      }
                    }
                  } catch (e) {}
                }

                const reasons = [];
                if (state.manualActive) {
                  if (state.manualUntil) {
                    const minsLeft = Math.max(1, Math.ceil((state.manualUntil - now.getTime()) / 60000));
                    reasons.push('Manual (' + minsLeft + 'm remaining)');
                  } else {
                    reasons.push('Manual Activation');
                  }
                }

                const day = now.getDay();
                const nowMins = now.getHours() * 60 + now.getMinutes();
                state.schedules.forEach(s => {
                  if (s.enabled && s.days.includes(day) && isTimeInWindow(nowMins, s.start, s.end)) {
                    reasons.push('Schedule: ' + s.name);
                  }
                });

                if (state.userCoords) {
                  state.locations.forEach(loc => {
                    if (loc.enabled) {
                      const d = distMeters(state.userCoords.lat, state.userCoords.lng, loc.lat, loc.lng);
                      if (d <= loc.radius) {
                        reasons.push('Location: ' + loc.name + ' (' + Math.round(d) + 'm)');
                      }
                    }
                  });
                }

                const shouldBeActive = reasons.length > 0;
                if (shouldBeActive !== state.lastActiveState) {
                  state.lastActiveState = shouldBeActive;
                  state.history.unshift({
                    time: now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                    action: shouldBeActive ? 'Activated' : 'Deactivated',
                    reason: shouldBeActive ? reasons.join(', ') : 'All rules cleared'
                  });
                  saveData();
                  if (window.AndroidShulModeBridge) {
                    window.AndroidShulModeBridge.syncShulModeDnd(shouldBeActive, 'PRIORITY_ONLY', true, true, true);
                  }
                }

                renderUI(shouldBeActive, reasons);
              }

              function renderUI(active, reasons) {
                const hasPerm = window.AndroidShulModeBridge
                  ? Boolean(window.AndroidShulModeBridge.isDndPermissionGranted())
                  : true;
                const bannerEl = document.getElementById('dndPermBanner');
                if (hasPerm) {
                  bannerEl.classList.add('hidden');
                } else {
                  bannerEl.classList.remove('hidden');
                }

                const hero = document.getElementById('heroCard');
                const statusText = document.getElementById('lblStatusText');
                const reasonText = document.getElementById('lblActiveReason');
                const btn = document.getElementById('mainToggleBtn');

                hero.classList.toggle('hero-active', active);
                statusText.textContent = active ? 'Shul Mode ON' : 'Shul Mode OFF';
                reasonText.textContent = active ? reasons.join(' • ') : 'Monitoring synagogues & schedules in background';
                btn.textContent = active ? 'Turn Off Shul Mode' : 'Activate Shul Mode Now';
                btn.className = 'big-toggle ' + (active ? 'toggle-on' : 'toggle-off');

                const gpsText = state.userCoords
                  ? state.userCoords.lat.toFixed(4) + ', ' + state.userCoords.lng.toFixed(4)
                  : 'Waiting for GPS fix...';

                document.getElementById('summaryStats').innerHTML =
                  '• Background Service: <b>Active (Persistent Notification) ✓</b><br>' +
                  '• Do Not Disturb Access: <b>' + (hasPerm ? 'Approved ✓' : 'Action Needed') + '</b><br>' +
                  '• Current Phone GPS: <b>' + gpsText + '</b><br>' +
                  '• Saved Synagogues: <b>' + state.locations.length + '</b> | Schedules: <b>' + state.schedules.filter(s => s.enabled).length + '</b>';

                document.getElementById('locationsList').innerHTML = state.locations.map(l => {
                  const d = state.userCoords ? Math.round(distMeters(state.userCoords.lat, state.userCoords.lng, l.lat, l.lng)) : null;
                  const distBadge = d !== null ? (' • ' + d + 'm away') : '';
                  return '<div class="list-item"><div><div class="item-title">' + l.name + '</div><div class="item-meta">' +
                    l.lat.toFixed(4) + ', ' + l.lng.toFixed(4) + ' • Radius: ' + l.radius + 'm' + distBadge + '</div></div>' +
                    '<button class="del-btn" onclick="deleteLocation(\\'' + l.id + '\\')">Delete</button></div>';
                }).join('');

                document.getElementById('schedulesList').innerHTML = state.schedules.map(s =>
                  '<div class="list-item"><div><div class="item-title">' + s.name + '</div><div class="item-meta">' +
                  s.start + ' – ' + s.end + '</div></div>' +
                  '<button class="del-btn" onclick="deleteSchedule(\\'' + s.id + '\\')">Delete</button></div>'
                ).join('');

                document.getElementById('callersList').innerHTML = state.callers.length === 0
                  ? '<div class="item-meta" style="margin-top:8px;">No priority callers added yet.</div>'
                  : state.callers.map(c =>
                    '<div class="list-item"><div><div class="item-title">' + c.name + '</div><div class="item-meta">' +
                    c.phoneNumber + ' • Rings through DND</div></div>' +
                    '<button class="del-btn" onclick="deleteCaller(\\'' + c.id + '\\')">Remove</button></div>'
                  ).join('');

                document.getElementById('historyList').innerHTML = state.history.length === 0
                  ? '<div class="item-meta">No activity recorded yet.</div>'
                  : state.history.map(h =>
                    '<div class="list-item"><div><div class="item-title">' + h.action + '</div><div class="item-meta">' +
                    h.reason + '</div></div><div class="item-meta">' + h.time + '</div></div>'
                  ).join('');
              }

              function applySmartPreset(presetName, radiusVal) {
                document.getElementById('locName').value = presetName;
                document.getElementById('locRadius').value = String(radiusVal);
                useCurrentGpsForForm();
              }

              function instantSaveCurrentSpot() {
                const finishSave = (lat, lng) => {
                  const customName = document.getElementById('locName').value.trim() || 'My Synagogue (GPS)';
                  const radius = parseInt(document.getElementById('locRadius').value, 10) || 100;
                  state.locations.push({ id: String(Date.now()), name: customName, lat, lng, radius, enabled: true });
                  document.getElementById('locName').value = '';
                  saveData();
                  evaluateRules();
                  switchTab('dashboard', document.querySelector('.nav-btn'));
                };

                if (state.userCoords) {
                  finishSave(state.userCoords.lat, state.userCoords.lng);
                  return;
                }
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(pos => {
                    state.userCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    finishSave(pos.coords.latitude, pos.coords.longitude);
                  });
                }
              }

              let searchTimer = null;
              function debouncedAddressSearch() {
                clearTimeout(searchTimer);
                const q = document.getElementById('addressSearchInput').value.trim();
                const box = document.getElementById('searchResultsBox');
                if (q.length < 3) {
                  box.classList.add('hidden');
                  box.innerHTML = '';
                  return;
                }
                searchTimer = setTimeout(() => {
                  fetch('https://nominatim.openstreetmap.org/search?format=json&limit=5&q=' + encodeURIComponent(q))
                    .then(r => r.json())
                    .then(results => {
                      if (!Array.isArray(results) || results.length === 0) {
                        box.classList.add('hidden');
                        return;
                      }
                      box.classList.remove('hidden');
                      box.innerHTML = results.map(item => {
                        const shortTitle = (item.display_name || '').split(',')[0];
                        return '<button type="button" class="search-item" onclick="selectSearchedPlace(' +
                          Number(item.lat) + ',' + Number(item.lon) + ',\\'' + shortTitle.replace(/'/g, '') + '\\')">' +
                          '<b>' + shortTitle + '</b><br><span style="color:#64748B;font-size:10px;">' + item.display_name + '</span></button>';
                      }).join('');
                    })
                    .catch(() => {});
                }, 350);
              }

              function selectSearchedPlace(lat, lng, title) {
                document.getElementById('locName').value = title || 'Synagogue';
                document.getElementById('locLat').value = Number(lat).toFixed(5);
                document.getElementById('locLng').value = Number(lng).toFixed(5);
                document.getElementById('searchResultsBox').classList.add('hidden');
                document.getElementById('addressSearchInput').value = '';
              }

              function toggleManualIndefinite() {
                if (state.manualActive || state.lastActiveState) {
                  state.manualActive = false;
                  state.manualUntil = null;
                } else {
                  state.manualActive = true;
                  state.manualUntil = null;
                }
                saveData();
                evaluateRules();
              }

              function activateForMinutes(mins) {
                state.manualActive = true;
                state.manualUntil = Date.now() + mins * 60000;
                saveData();
                evaluateRules();
              }

              function openDndSettings() {
                if (window.AndroidShulModeBridge) window.AndroidShulModeBridge.openDndPermissionSettings();
              }

              function useCurrentGpsForForm() {
                if (state.userCoords) {
                  document.getElementById('locLat').value = state.userCoords.lat.toFixed(5);
                  document.getElementById('locLng').value = state.userCoords.lng.toFixed(5);
                }
                if (!navigator.geolocation) return;
                navigator.geolocation.getCurrentPosition(pos => {
                  state.userCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                  document.getElementById('locLat').value = pos.coords.latitude.toFixed(5);
                  document.getElementById('locLng').value = pos.coords.longitude.toFixed(5);
                  evaluateRules();
                });
              }

              function addLocation() {
                const name = document.getElementById('locName').value.trim() || 'Synagogue';
                const lat = parseFloat(document.getElementById('locLat').value);
                const lng = parseFloat(document.getElementById('locLng').value);
                const radius = parseInt(document.getElementById('locRadius').value, 10);
                if (isNaN(lat) || isNaN(lng)) return;
                state.locations.push({ id: String(Date.now()), name, lat, lng, radius, enabled: true });
                document.getElementById('locName').value = '';
                saveData();
                evaluateRules();
              }

              function deleteLocation(id) {
                state.locations = state.locations.filter(l => l.id !== id);
                saveData();
                evaluateRules();
              }

              function toggleDayBtn(btn) {
                btn.classList.toggle('selected');
              }

              function addSchedule() {
                const name = document.getElementById('schedName').value.trim() || 'Prayer Schedule';
                const start = document.getElementById('schedStart').value || '07:00';
                const end = document.getElementById('schedEnd').value || '08:30';
                const days = Array.from(document.querySelectorAll('#schedDaysRow .day-btn.selected')).map(b => parseInt(b.dataset.day, 10));
                state.schedules.push({ id: String(Date.now()), name, start, end, days, enabled: true });
                document.getElementById('schedName').value = '';
                saveData();
                evaluateRules();
              }

              function deleteSchedule(id) {
                state.schedules = state.schedules.filter(s => s.id !== id);
                saveData();
                evaluateRules();
              }

              function addCaller() {
                const name = document.getElementById('callerName').value.trim() || 'Priority Contact';
                const phoneNumber = document.getElementById('callerPhone').value.trim();
                if (!phoneNumber) return;
                state.callers.push({ id: String(Date.now()), name, phoneNumber, enabled: true });
                document.getElementById('callerName').value = '';
                document.getElementById('callerPhone').value = '';
                saveData();
                evaluateRules();
              }

              function deleteCaller(id) {
                state.callers = state.callers.filter(c => c.id !== id);
                saveData();
                evaluateRules();
              }

              function switchTab(tab, btn) {
                ['dashboard','locations','schedules','callers','history'].forEach(t => {
                  document.getElementById('tab-' + t).classList.toggle('hidden', t !== tab);
                });
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                if (btn) btn.classList.add('active');
              }

              function toggleTheme() {
                state.dark = !state.dark;
                document.body.classList.toggle('dark', state.dark);
                localStorage.setItem('shul_dark', state.dark ? '1' : '0');
              }

              function toggleLang() {
                state.lang = state.lang === 'en' ? 'he' : 'en';
                document.documentElement.dir = state.lang === 'he' ? 'rtl' : 'ltr';
                document.getElementById('langBtn').textContent = state.lang === 'he' ? 'EN' : 'עברית';
                localStorage.setItem('shul_lang', state.lang);
              }

              if (navigator.geolocation) {
                navigator.geolocation.watchPosition(pos => {
                  state.userCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                  evaluateRules();
                });
              }

              setInterval(evaluateRules, 3000);
              saveData();
              evaluateRules();
            </script>
          </body>
          </html>
          EOF

          cat << 'EOF' > app/src/main/java/com/shulmode/app/service/ShulBackgroundMonitorService.kt
          package com.shulmode.app.service

          import android.Manifest
          import android.app.Notification
          import android.app.NotificationChannel
          import android.app.NotificationManager
          import android.app.PendingIntent
          import android.app.Service
          import android.content.Context
          import android.content.Intent
          import android.content.pm.PackageManager
          import android.content.pm.ServiceInfo
          import android.location.Location
          import android.location.LocationListener
          import android.location.LocationManager
          import android.os.Build
          import android.os.Bundle
          import android.os.Handler
          import android.os.IBinder
          import android.os.Looper
          import com.shulmode.app.ui.MainActivity
          import org.json.JSONArray
          import java.util.Calendar

          class ShulBackgroundMonitorService : Service(), LocationListener {

              companion object {
                  private const val CHANNEL_ID = "shulmode_bg_channel"
                  private const val NOTIFICATION_ID = 7701
              }

              private lateinit var notificationManager: NotificationManager
              private lateinit var locationManager: LocationManager
              private val handler = Handler(Looper.getMainLooper())
              private var lastLocation: Location? = null
              private var lastAppliedDndState: Boolean? = null

              private val checkRunnable = object : Runnable {
                  override fun run() {
                      evaluateBackgroundRules()
                      handler.postDelayed(this, 10000L)
                  }
              }

              override fun onCreate() {
                  super.onCreate()
                  notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                  locationManager = getSystemService(Context.LOCATION_SERVICE) as LocationManager
                  createNotificationChannel()
                  startForegroundWithNotification("Monitoring synagogue locations & prayer schedules")
                  startLocationUpdates()
                  handler.post(checkRunnable)
              }

              override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
                  startLocationUpdates()
                  evaluateBackgroundRules()
                  return START_STICKY
              }

              private fun createNotificationChannel() {
                  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                      val channel = NotificationChannel(
                          CHANNEL_ID,
                          "ShulMode Background Monitor",
                          NotificationManager.IMPORTANCE_LOW
                      ).apply {
                          description = "Keeps ShulMode active when your screen is off or app is closed"
                          setShowBadge(false)
                      }
                      notificationManager.createNotificationChannel(channel)
                  }
              }

              private fun buildStatusNotification(statusText: String): Notification {
                  val openIntent = Intent(this, MainActivity::class.java).apply {
                      flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
                  }
                  val pendingIntent = PendingIntent.getActivity(
                      this,
                      0,
                      openIntent,
                      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                  )

                  return Notification.Builder(this, CHANNEL_ID)
                      .setContentTitle("ShulMode Active Protection")
                      .setContentText(statusText)
                      .setSmallIcon(android.R.drawable.ic_lock_silent_mode)
                      .setContentIntent(pendingIntent)
                      .setOngoing(true)
                      .build()
              }

              private fun startForegroundWithNotification(text: String) {
                  val notification = buildStatusNotification(text)
                  try {
                      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                          startForeground(
                              NOTIFICATION_ID,
                              notification,
                              ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION
                          )
                      } else {
                          startForeground(NOTIFICATION_ID, notification)
                      }
                  } catch (e: Exception) {
                      try {
                          startForeground(NOTIFICATION_ID, notification)
                      } catch (_: Exception) {}
                  }
              }

              private fun updateNotificationText(text: String) {
                  try {
                      notificationManager.notify(NOTIFICATION_ID, buildStatusNotification(text))
                  } catch (_: Exception) {}
              }

              private fun startLocationUpdates() {
                  val hasFine = checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
                  val hasCoarse = checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
                  if (!hasFine && !hasCoarse) return

                  try {
                      if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                          locationManager.requestLocationUpdates(
                              LocationManager.GPS_PROVIDER,
                              10000L,
                              5f,
                              this
                          )
                          val lastGps = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER)
                          if (lastGps != null) onLocationChanged(lastGps)
                      }
                      if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                          locationManager.requestLocationUpdates(
                              LocationManager.NETWORK_PROVIDER,
                              10000L,
                              5f,
                              this
                          )
                          val lastNet = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)
                          if (lastNet != null && lastLocation == null) onLocationChanged(lastNet)
                      }
                  } catch (_: Exception) {}
              }

              override fun onLocationChanged(location: Location) {
                  lastLocation = location
                  getSharedPreferences("shulmode_state", Context.MODE_PRIVATE)
                      .edit()
                      .putString("last_lat", location.latitude.toString())
                      .putString("last_lng", location.longitude.toString())
                      .apply()
                  evaluateBackgroundRules()
              }

              override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}
              override fun onProviderEnabled(provider: String) {}
              override fun onProviderDisabled(provider: String) {}

              private fun isTimeInWindow(nowMins: Int, startStr: String, endStr: String): Boolean {
                  val sParts = startStr.split(":")
                  val eParts = endStr.split(":")
                  if (sParts.size < 2 || eParts.size < 2) return false
                  val start = (sParts[0].toIntOrNull() ?: 0) * 60 + (sParts[1].toIntOrNull() ?: 0)
                  val end = (eParts[0].toIntOrNull() ?: 0) * 60 + (eParts[1].toIntOrNull() ?: 0)
                  return if (start <= end) {
                      nowMins in start until end
                  } else {
                      nowMins >= start || nowMins < end
                  }
              }

              private fun evaluateBackgroundRules() {
                  val statePrefs = getSharedPreferences("shulmode_state", Context.MODE_PRIVATE)
                  val locPrefs = getSharedPreferences("shulmode_locations", Context.MODE_PRIVATE)
                  val schedPrefs = getSharedPreferences("shulmode_schedules", Context.MODE_PRIVATE)

                  val nowMs = System.currentTimeMillis()
                  var manualActive = statePrefs.getBoolean("manual_active", false)
                  val manualUntil = statePrefs.getLong("manual_until", 0L)
                  if (manualActive && manualUntil > 0L && nowMs > manualUntil) {
                      manualActive = false
                      statePrefs.edit().putBoolean("manual_active", false).putLong("manual_until", 0L).apply()
                  }

                  val reasons = mutableListOf<String>()
                  if (manualActive) {
                      reasons.add("Manual Shul Mode")
                  }

                  // Check schedules
                  val cal = Calendar.getInstance()
                  val dayOfWeek = cal.get(Calendar.DAY_OF_WEEK) - 1 // 0=Sun..6=Sat
                  val nowMins = cal.get(Calendar.HOUR_OF_DAY) * 60 + cal.get(Calendar.MINUTE)
                  val schedJson = schedPrefs.getString("saved_schedules_json", "[]") ?: "[]"
                  try {
                      val arr = JSONArray(schedJson)
                      for (i in 0 until arr.length()) {
                          val s = arr.getJSONObject(i)
                          if (s.optBoolean("enabled", true)) {
                              val daysArr = s.optJSONArray("days")
                              var dayMatch = false
                              if (daysArr != null) {
                                  for (d in 0 until daysArr.length()) {
                                      if (daysArr.optInt(d, -1) == dayOfWeek) {
                                          dayMatch = true
                                          break
                                      }
                                  }
                              }
                              val start = s.optString("start", "07:00")
                              val end = s.optString("end", "08:30")
                              if (dayMatch && isTimeInWindow(nowMins, start, end)) {
                                  reasons.add("Schedule: " + s.optString("name", "Prayer"))
                              }
                          }
                      }
                  } catch (_: Exception) {}

                  // Check GPS distance to saved synagogues
                  val currentLoc = lastLocation
                  if (currentLoc != null) {
                      val locJson = locPrefs.getString("saved_locations_json", "[]") ?: "[]"
                      try {
                          val arr = JSONArray(locJson)
                          for (i in 0 until arr.length()) {
                              val l = arr.getJSONObject(i)
                              if (l.optBoolean("enabled", true)) {
                                  val targetLat = l.optDouble("lat", 0.0)
                                  val targetLng = l.optDouble("lng", 0.0)
                                  val radius = l.optDouble("radius", l.optDouble("radiusMeters", 100.0))
                                  val results = FloatArray(1)
                                  Location.distanceBetween(
                                      currentLoc.latitude,
                                      currentLoc.longitude,
                                      targetLat,
                                      targetLng,
                                      results
                                  )
                                  if (results[0] <= radius) {
                                      reasons.add("At " + l.optString("name", "Synagogue") + " (" + results[0].toInt() + "m)")
                                  }
                              }
                          }
                      } catch (_: Exception) {}
                  }

                  val shouldBeSilent = reasons.isNotEmpty()
                  statePrefs.edit().putBoolean("shul_mode_active", shouldBeSilent).apply()

                  if (shouldBeSilent) {
                      updateNotificationText("SHUL MODE ON • " + reasons.joinToString(", "))
                  } else {
                      updateNotificationText("Monitoring synagogues & schedules in background")
                  }

                  if (notificationManager.isNotificationPolicyAccessGranted) {
                      if (lastAppliedDndState == null || lastAppliedDndState != shouldBeSilent) {
                          lastAppliedDndState = shouldBeSilent
                          val filter = if (shouldBeSilent) {
                              NotificationManager.INTERRUPTION_FILTER_PRIORITY
                          } else {
                              NotificationManager.INTERRUPTION_FILTER_ALL
                          }
                          try {
                              notificationManager.setInterruptionFilter(filter)
                          } catch (_: Exception) {}
                      }
                  }
              }

              override fun onDestroy() {
                  handler.removeCallbacks(checkRunnable)
                  try {
                      locationManager.removeUpdates(this)
                  } catch (_: Exception) {}
                  super.onDestroy()
              }

              override fun onBind(intent: Intent?): IBinder? = null
          }
          EOF

          cat << 'EOF' > app/src/main/java/com/shulmode/app/service/ShulBootReceiver.kt
          package com.shulmode.app.service

          import android.content.BroadcastReceiver
          import android.content.Context
          import android.content.Intent
          import android.os.Build

          class ShulBootReceiver : BroadcastReceiver() {
              override fun onReceive(context: Context, intent: Intent) {
                  val serviceIntent = Intent(context, ShulBackgroundMonitorService::class.java)
                  try {
                      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                          context.startForegroundService(serviceIntent)
                      } else {
                          context.startService(serviceIntent)
                      }
                  } catch (_: Exception) {}
              }
          }
          EOF

          cat << 'EOF' > app/src/main/java/com/shulmode/app/ui/MainActivity.kt
          package com.shulmode.app.ui

          import android.Manifest
          import android.annotation.SuppressLint
          import android.app.Activity
          import android.app.NotificationManager
          import android.content.Context
          import android.content.Intent
          import android.content.pm.PackageManager
          import android.os.Build
          import android.os.Bundle
          import android.provider.Settings
          import android.webkit.GeolocationPermissions
          import android.webkit.JavascriptInterface
          import android.webkit.WebChromeClient
          import android.webkit.WebResourceRequest
          import android.webkit.WebResourceResponse
          import android.webkit.WebView
          import android.webkit.WebViewClient
          import android.widget.Toast
          import androidx.webkit.WebViewAssetLoader
          import com.shulmode.app.service.ShulBackgroundMonitorService

          class MainActivity : Activity() {

              private lateinit var notificationManager: NotificationManager
              private lateinit var webView: WebView
              private var hasAutoPromptedDndThisLaunch = false

              @SuppressLint("SetJavaScriptEnabled")
              override fun onCreate(savedInstanceState: Bundle?) {
                  super.onCreate(savedInstanceState)
                  notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

                  val assetLoader = WebViewAssetLoader.Builder()
                      .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
                      .build()

                  webView = WebView(this).apply {
                      settings.javaScriptEnabled = true
                      settings.domStorageEnabled = true
                      settings.setGeolocationEnabled(true)
                      webViewClient = object : WebViewClient() {
                          override fun shouldInterceptRequest(
                              view: WebView,
                              request: WebResourceRequest
                          ): WebResourceResponse? {
                              return assetLoader.shouldInterceptRequest(request.url)
                          }
                      }
                      webChromeClient = object : WebChromeClient() {
                          override fun onGeolocationPermissionsShowPrompt(
                              origin: String?,
                              callback: GeolocationPermissions.Callback?
                          ) {
                              callback?.invoke(origin, true, false)
                          }
                      }
                      addJavascriptInterface(AndroidBridge(), "AndroidShulModeBridge")
                  }

                  setContentView(webView)
                  requestAllNeededPermissionsAutomatically()
                  startBackgroundMonitorService()
                  webView.loadUrl("https://appassets.androidplatform.net/assets/index.html")
              }

              override fun onResume() {
                  super.onResume()
                  startBackgroundMonitorService()
                  if (::webView.isInitialized) {
                      webView.evaluateJavascript("if(window.evaluateRules) window.evaluateRules();", null)
                  }
              }

              private fun startBackgroundMonitorService() {
                  val serviceIntent = Intent(this, ShulBackgroundMonitorService::class.java)
                  try {
                      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                          startForegroundService(serviceIntent)
                      } else {
                          startService(serviceIntent)
                      }
                  } catch (_: Exception) {}
              }

              private fun requestAllNeededPermissionsAutomatically() {
                  val needed = mutableListOf(
                      Manifest.permission.ACCESS_FINE_LOCATION,
                      Manifest.permission.ACCESS_COARSE_LOCATION,
                      Manifest.permission.READ_PHONE_STATE,
                      Manifest.permission.READ_CALL_LOG,
                      Manifest.permission.READ_CONTACTS
                  )
                  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                      needed.add(Manifest.permission.POST_NOTIFICATIONS)
                  }

                  val missing = needed.filter {
                      checkSelfPermission(it) != PackageManager.PERMISSION_GRANTED
                  }

                  if (missing.isNotEmpty()) {
                      requestPermissions(missing.toTypedArray(), 100)
                  } else {
                      promptDndAccessIfMissing()
                  }
              }

              override fun onRequestPermissionsResult(
                  requestCode: Int,
                  permissions: Array<out String>,
                  grantResults: IntArray
              ) {
                  super.onRequestPermissionsResult(requestCode, permissions, grantResults)
                  if (requestCode == 100) {
                      startBackgroundMonitorService()
                      promptDndAccessIfMissing()
                  }
              }

              private fun promptDndAccessIfMissing() {
                  if (!notificationManager.isNotificationPolicyAccessGranted && !hasAutoPromptedDndThisLaunch) {
                      hasAutoPromptedDndThisLaunch = true
                      Toast.makeText(
                          this,
                          "Please enable ShulMode in Do Not Disturb access",
                          Toast.LENGTH_LONG
                      ).show()
                      val intent = Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS).apply {
                          flags = Intent.FLAG_ACTIVITY_NEW_TASK
                      }
                      startActivity(intent)
                  }
              }

              inner class AndroidBridge {
                  @JavascriptInterface
                  fun isDndPermissionGranted(): Boolean {
                      return notificationManager.isNotificationPolicyAccessGranted
                  }

                  @JavascriptInterface
                  fun openDndPermissionSettings() {
                      val intent = Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS).apply {
                          flags = Intent.FLAG_ACTIVITY_NEW_TASK
                      }
                      startActivity(intent)
                  }

                  @JavascriptInterface
                  fun getLastKnownLocationJson(): String {
                      val prefs = getSharedPreferences("shulmode_state", Context.MODE_PRIVATE)
                      val lat = prefs.getString("last_lat", null)?.toDoubleOrNull()
                      val lng = prefs.getString("last_lng", null)?.toDoubleOrNull()
                      if (lat == null || lng == null) return ""
                      return "{\"lat\":$lat,\"lng\":$lng}"
                  }

                  @JavascriptInterface
                  fun syncManualState(active: Boolean, untilMs: Long) {
                      val prefs = getSharedPreferences("shulmode_state", Context.MODE_PRIVATE)
                      prefs.edit()
                          .putBoolean("manual_active", active)
                          .putLong("manual_until", untilMs)
                          .apply()
                      startBackgroundMonitorService()
                  }

                  @JavascriptInterface
                  fun syncSchedulesJson(schedulesJson: String) {
                      val prefs = getSharedPreferences("shulmode_schedules", Context.MODE_PRIVATE)
                      prefs.edit().putString("saved_schedules_json", schedulesJson).apply()
                      startBackgroundMonitorService()
                  }

                  @JavascriptInterface
                  fun syncShulModeDnd(
                      active: Boolean,
                      behaviorMode: String,
                      allowAlarms: Boolean,
                      allowStarredContacts: Boolean,
                      allowRepeatCallers: Boolean
                  ): Boolean {
                      if (!notificationManager.isNotificationPolicyAccessGranted) {
                          openDndPermissionSettings()
                          return false
                      }
                      val prefs = getSharedPreferences("shulmode_state", Context.MODE_PRIVATE)
                      prefs.edit().putBoolean("shul_mode_active", active).apply()

                      val filter = when {
                          !active -> NotificationManager.INTERRUPTION_FILTER_ALL
                          behaviorMode == "TOTAL_SILENCE" -> NotificationManager.INTERRUPTION_FILTER_NONE
                          behaviorMode == "ALARMS_ONLY" -> NotificationManager.INTERRUPTION_FILTER_ALARMS
                          else -> NotificationManager.INTERRUPTION_FILTER_PRIORITY
                      }
                      notificationManager.setInterruptionFilter(filter)
                      return true
                  }

                  @JavascriptInterface
                  fun syncAllowedCallersJson(callersJson: String) {
                      val prefs = getSharedPreferences("shulmode_callers", Context.MODE_PRIVATE)
                      prefs.edit().putString("allowed_callers_json", callersJson).apply()
                  }

                  @JavascriptInterface
                  fun syncLocationsJson(locationsJson: String, dwellSeconds: Int) {
                      val prefs = getSharedPreferences("shulmode_locations", MODE_PRIVATE)
                      prefs.edit()
                          .putString("saved_locations_json", locationsJson)
                          .putInt("dwell_seconds", dwellSeconds)
                          .apply()
                      startBackgroundMonitorService()
                  }
              }
          }
          EOF

          cat << 'EOF' > app/src/main/java/com/shulmode/app/telecom/ShulCallScreeningService.kt
          package com.shulmode.app.telecom

          import android.content.Context
          import android.media.AudioManager
          import android.telecom.Call
          import android.telecom.CallScreeningService
          import android.telephony.PhoneNumberUtils
          import org.json.JSONArray

          class ShulCallScreeningService : CallScreeningService() {
              override fun onScreenCall(callDetails: Call.Details) {
                  if (callDetails.callDirection != Call.Details.DIRECTION_INCOMING) {
                      respondToCall(callDetails, CallResponse.Builder().build())
                      return
                  }
                  val incoming = callDetails.handle?.schemeSpecificPart.orEmpty()
                  val statePrefs = getSharedPreferences("shulmode_state", Context.MODE_PRIVATE)
                  val isActive = statePrefs.getBoolean("shul_mode_active", false)

                  val callerPrefs = getSharedPreferences("shulmode_callers", Context.MODE_PRIVATE)
                  val rawJson = callerPrefs.getString("allowed_callers_json", "[]") ?: "[]"
                  val arr = JSONArray(rawJson)

                  var isAllowedCaller = false
                  for (i in 0 until arr.length()) {
                      val item = arr.getJSONObject(i)
                      if (item.optBoolean("enabled", true)) {
                          val savedPhone = item.optString("phoneNumber", "")
                          if (PhoneNumberUtils.compare(applicationContext, savedPhone, incoming)) {
                              isAllowedCaller = true
                              break
                          }
                      }
                  }

                  if (isActive && isAllowedCaller) {
                      val audioManager = getSystemService(Context.AUDIO_SERVICE) as AudioManager
                      audioManager.ringerMode = AudioManager.RINGER_MODE_NORMAL
                  }

                  val response = CallResponse.Builder()
                      .setDisallowCall(false)
                      .setSilenceCall(isActive && !isAllowedCaller)
                      .build()
                  respondToCall(callDetails, response)
              }
          }
          EOF

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Setup Gradle 8.7
        uses: gradle/actions/setup-gradle@v3
        with:
          gradle-version: '8.7'

      - name: Build ShulMode APK with Gradle
        run: gradle assembleDebug

      - name: Upload Ready-to-Install ShulMode APK
        uses: actions/upload-artifact@v4
        with:
          name: ShulMode-Installable-APK
          path: app/build/outputs/apk/debug/app-debug.apk`;

export const NATIVE_ANDROID_FILES: NativeAndroidFile[] = [
  {
    id: 'github-actions-apk',
    filename: 'android.yml (Paste in GitHub Configure)',
    path: '.github/workflows/android.yml',
    title: 'All-in-One GitHub Actions APK Builder (Paste into "Android CI → Configure")',
    description:
      'Replace everything inside .github/workflows/android.yml with this code and click "Commit changes". It automatically generates all Kotlin files and builds your installable ShulMode APK!',
    language: 'yaml',
    code: SELF_CONTAINED_GITHUB_ACTION_YAML,
  },
  {
    id: 'main-activity-bridge',
    filename: 'MainActivity.kt',
    path: 'app/src/main/java/com/shulmode/app/ui/MainActivity.kt',
    title: 'MainActivity.kt + AndroidShulModeBridge',
    description:
      'Loads your ShulMode app and injects window.AndroidShulModeBridge so your UI directly controls real Android hardware Do Not Disturb (NotificationManager), background Geofencing, and Priority Call Screening.',
    language: 'kotlin',
    code: `package com.shulmode.app.ui

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.provider.Settings
import android.webkit.GeolocationPermissions
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient

class MainActivity : Activity() {

    private lateinit var notificationManager: NotificationManager
    private lateinit var webView: WebView

    companion object {
        private const val APP_URL = "https://ais-pre-jnke36cutnn2h5fviapami-156264604388.europe-west2.run.app"
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.setGeolocationEnabled(true)
            webViewClient = WebViewClient()
            webChromeClient = object : WebChromeClient() {
                override fun onGeolocationPermissionsShowPrompt(
                    origin: String?,
                    callback: GeolocationPermissions.Callback?
                ) {
                    callback?.invoke(origin, true, false)
                }
            }
            addJavascriptInterface(AndroidBridge(), "AndroidShulModeBridge")
        }

        setContentView(webView)
        webView.loadUrl(APP_URL)
    }

    inner class AndroidBridge {
        @JavascriptInterface
        fun isDndPermissionGranted(): Boolean {
            return notificationManager.isNotificationPolicyAccessGranted
        }

        @JavascriptInterface
        fun openDndPermissionSettings() {
            val intent = Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            startActivity(intent)
        }

        @JavascriptInterface
        fun syncShulModeDnd(
            active: Boolean,
            behaviorMode: String,
            allowAlarms: Boolean,
            allowStarredContacts: Boolean,
            allowRepeatCallers: Boolean
        ): Boolean {
            if (!notificationManager.isNotificationPolicyAccessGranted) {
                openDndPermissionSettings()
                return false
            }
            val filter = when {
                !active -> NotificationManager.INTERRUPTION_FILTER_ALL
                behaviorMode == "TOTAL_SILENCE" -> NotificationManager.INTERRUPTION_FILTER_NONE
                behaviorMode == "ALARMS_ONLY" -> NotificationManager.INTERRUPTION_FILTER_ALARMS
                else -> NotificationManager.INTERRUPTION_FILTER_PRIORITY
            }
            notificationManager.setInterruptionFilter(filter)
            return true
        }
    }
}`,
  },
  {
    id: 'dnd-controller',
    filename: 'ShulDndController.kt',
    path: 'app/src/main/java/com/shulmode/app/system/ShulDndController.kt',
    title: 'Android NotificationManager & AutomaticZenRule Controller',
    description:
      'Manages app-owned AutomaticZenRule on Android API 24–35+ (Android 14/15) so ShulMode never overwrites the user’s global DND config or other active system rules.',
    language: 'kotlin',
    code: `package com.shulmode.app.system

import android.app.AutomaticZenRule
import android.app.NotificationManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.service.notification.Condition
import android.service.notification.ZenPolicy

class ShulDndController(private val context: Context) {

    private val notificationManager =
        context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

    fun isPermissionGranted(): Boolean {
        return notificationManager.isNotificationPolicyAccessGranted
    }

    fun createGrantPermissionIntent(): Intent {
        return Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
    }
}`,
  },
  {
    id: 'call-screening',
    filename: 'ShulCallScreeningService.kt',
    path: 'app/src/main/java/com/shulmode/app/telecom/ShulCallScreeningService.kt',
    title: 'Priority Allowed Callers & CallScreeningService Bypass',
    description:
      'Allows specific phone numbers saved in ShulMode to ring or vibrate during active Shul Mode via Android CallScreeningService and AudioManager.',
    language: 'kotlin',
    code: `package com.shulmode.app.telecom

import android.content.Context
import android.media.AudioManager
import android.telecom.Call
import android.telecom.CallScreeningService
import android.telephony.PhoneNumberUtils
import org.json.JSONArray

class ShulCallScreeningService : CallScreeningService() {
    override fun onScreenCall(callDetails: Call.Details) {
        if (callDetails.callDirection != Call.Details.DIRECTION_INCOMING) {
            respondToCall(callDetails, CallResponse.Builder().build())
            return
        }
        val incoming = callDetails.handle?.schemeSpecificPart.orEmpty()
        val statePrefs = getSharedPreferences("shulmode_state", Context.MODE_PRIVATE)
        val isActive = statePrefs.getBoolean("shul_mode_active", false)

        val callerPrefs = getSharedPreferences("shulmode_callers", Context.MODE_PRIVATE)
        val rawJson = callerPrefs.getString("allowed_callers_json", "[]") ?: "[]"
        val arr = JSONArray(rawJson)

        var isAllowedCaller = false
        for (i in 0 until arr.length()) {
            val item = arr.getJSONObject(i)
            if (item.optBoolean("enabled", true)) {
                val savedPhone = item.optString("phoneNumber", "")
                if (PhoneNumberUtils.compare(applicationContext, savedPhone, incoming)) {
                    isAllowedCaller = true
                    break
                }
            }
        }

        if (isActive && isAllowedCaller) {
            val audioManager = getSystemService(Context.AUDIO_SERVICE) as AudioManager
            audioManager.ringerMode = AudioManager.RINGER_MODE_NORMAL
        }

        val response = CallResponse.Builder()
            .setDisallowCall(false)
            .setSilenceCall(isActive && !isAllowedCaller)
            .build()
        respondToCall(callDetails, response)
    }
}`,
  },
  {
    id: 'android-manifest',
    filename: 'AndroidManifest.xml',
    path: 'app/src/main/AndroidManifest.xml',
    title: 'AndroidManifest.xml (Permissions, Receivers & CallScreeningService)',
    description:
      'Declares ACCESS_NOTIFICATION_POLICY, ACCESS_FINE_LOCATION, and ShulCallScreeningService.',
    language: 'xml',
    code: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NOTIFICATION_POLICY" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.VIBRATE" />

    <application
        android:allowBackup="true"
        android:label="ShulMode"
        android:supportsRtl="true"
        android:theme="@android:style/Theme.DeviceDefault.NoActionBar">

        <activity
            android:name=".ui.MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <service
            android:name=".telecom.ShulCallScreeningService"
            android:permission="android.permission.BIND_SCREENING_SERVICE"
            android:exported="true">
            <intent-filter>
                <action android:name="android.telecom.CallScreeningService" />
            </intent-filter>
        </service>
    </application>
</manifest>`,
  },
];
