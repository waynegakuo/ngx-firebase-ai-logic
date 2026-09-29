# Firebase Console setup for ngx-firebase-ai-logic

This library wires **App Check + Firebase AI Logic** in Angular. You still configure Firebase in the Console. Replace `<project-id>` with your Firebase project ID.

**Requires:** Firebase JS SDK **12.19.0+** (current Gemini + App Check behaviour).

Step-by-step companion: [Firebase AI Logic in Angular (DEV)](https://dev.to/gde/firebase-ai-logic-in-angular-client-side-gemini-without-a-custom-backend-54eh).

---

## 1. Create a Firebase project and web app

1. [Create a project](https://console.firebase.google.com/)
2. Add app → **Web** (`</>`)
3. Copy the `firebaseConfig` object — you will paste it in `src/environments/firebase.config.ts`

---

## 2. Enable Firebase AI Logic (do this early)

1. **AI Services** → **AI Logic** → **Get started**
2. Choose **Gemini Developer API** and finish the setup wizard. Enable the APIs recommended and AI monitoring.
3. Wait **5–10 minutes**, then in Google Cloud (same project ID): **APIs & Services** → **Enabled APIs & services** → scroll to the API table → use **Filter** to confirm:
   - **Firebase AI Logic API**
   - **Gemini API** (`generativelanguage.googleapis.com`) — Firebase's wizard labels this **Gemini Developer API**; GCP may show **Gemini API**

You may also see **Gemini for Google Cloud API** when filtering `Gemini` — that is for Gemini inside the Cloud Console and is **not** required for Firebase AI Logic in your Angular app.

Skipping this step is the most common cause of **403 "The caller does not have permission"** later.

---

## 3. reCAPTCHA Enterprise + App Check

### 3a. Create a reCAPTCHA Enterprise key

1. Google Cloud (same project) → **Security** → **Fraud Defense** → enable **reCAPTCHA Enterprise API**
2. **Keys** tab → **Create key** → any display name → **Website**
3. **Domains** — production only. **Do not add `localhost`**. For example:
   - `<project-id>.web.app`
   - `<project-id>.firebaseapp.com`
   - Any custom domain you use later
4. **Create key** → copy the site key (starts with `6L...`)

### 3b. Register App Check

1. Firebase Console → **Security** → **App Check** → **Apps** tab → your web app → **reCAPTCHA Enterprise** → paste site key
2. **APIs** tab → **Firebase AI Logic** — Monitoring and Baseline Protection are enabled by default (`Basic - Enforced`). You can add **Replay Protection** if you want (this library enables limited-use tokens in production by default).

Pass the site key to `provideFirebaseAILogic({ recaptchaEnterpriseSiteKey: ... })`.

---

## 4. Browser API key restrictions

1. Google Cloud → **APIs & Services** → **Credentials**
2. Open the **Browser key** matching your `firebaseConfig.apiKey`
3. **API restrictions:** about 25 APIs may already be allowed — ensure **Firebase AI Logic API** and **Firebase App Check API** are included. **Do not** add Generative Language API separately.
4. **Application restrictions:** **None** while developing on `localhost`

---

## 5. Localhost debug token

1. Set `appCheckDebugToken: true` in `environment.development.ts` (or pass to `provideFirebaseAILogic()`)
2. Add the localhost script in `index.html` (see README)
3. Run `ng serve` → DevTools → Console → `AppCheck debug token: "..."`
4. Firebase Console → App Check → your web app → **Manage debug tokens** → add UUID
5. Hard refresh → `[ngx-firebase-ai-logic] Gemini generateContent probe: OK` (when dev diagnostics are enabled)

The debug token is minted by the SDK and printed once App Check initializes. It is **only for development** — production must use reCAPTCHA, not debug tokens.

---

## Troubleshooting

| Symptom | Fix |
|--------|-----|
| `ExchangeDebugToken` blocked | Add Firebase App Check API to Browser key |
| `generateContent` 403 | Run AI Logic → Get started; confirm debug token registered; verify Browser key allowlist; wait a few minutes and hard-refresh |
| `App Check token fetch failed` | Register debug token; confirm `index.html` script on localhost |
| `Role 'function' is not supported` | Firebase SDK 12.19.0+ |

Service agent: `service-<messagingSenderId>@gcp-sa-firebasevertexai.iam.gserviceaccount.com`

---

## Verify it worked

Click **Ask Gemini** in your demo UI. Text back with no 403 is the pass/fail check.

Optional: DevTools → Network → filter `firebasevertexai` → confirm POST to `:generateContent` returns **200**.
