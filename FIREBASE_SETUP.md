# Firebase Console setup for ngx-firebase-ai-logic

This library wires **App Check + Firebase AI Logic** in Angular. You still configure Firebase in the Console. Replace `<project-id>` with your Firebase project ID.

**Requires:** Firebase JS SDK **12.19.0+** (Gemini 3 function calling).

---

## 1. Create a Firebase project

[Create a project](https://console.firebase.google.com/) and note your **Project ID** (`https://<project-id>.web.app`).

---

## 2. Register a web app

1. Add a **Web** app in Firebase Console
2. Copy the `firebaseConfig` object — pass it to `provideFirebaseAILogic({ firebaseConfig: ... })`

---

## 3. Firebase AI Logic (do this early)

1. **Build** → **AI Logic** → **Get started** → **Gemini Developer API**
2. Wait 5–10 minutes
3. Verify enabled: **Firebase AI Logic API** + **Gemini Developer API**

---

## 4. reCAPTCHA Enterprise + App Check

1. Google Cloud → **reCAPTCHA Enterprise** → create **score-based (v3)** key
2. Domains: `<project-id>.web.app`, `<project-id>.firebaseapp.com` — **not** `localhost`
3. Pass site key to `provideFirebaseAILogic({ recaptchaEnterpriseSiteKey: ... })`
4. Firebase Console → **App Check** → register reCAPTCHA on your web app
5. **APIs** tab → enforce **Firebase AI Logic**

---

## 5. Browser API key restrictions

Google Cloud → **Credentials** → your Browser key:

- **API restrictions:** Firebase AI Logic + Firebase App Check only
- **Do not** add Generative Language API
- **Application restrictions:** None for localhost dev

---

## 6. Localhost debug token

1. Set `appCheckDebugToken: true` in `provideFirebaseAILogic()` (non-production)
2. Optionally set `self.FIREBASE_APPCHECK_DEBUG_TOKEN = true` in `index.html` on localhost
3. Run app → Console → `AppCheck debug token: "..."`
4. Firebase Console → App Check → **Manage debug tokens** → add UUID
5. Hard refresh → `[ngx-firebase-ai-logic] Gemini generateContent probe: OK`

---

## Troubleshooting

| Symptom | Fix |
|--------|-----|
| `ExchangeDebugToken` blocked | Add Firebase App Check API to Browser key |
| `generateContent` 403 | Run AI Logic → Get started; verify API key |
| `Role 'function' is not supported` | Firebase SDK 12.19.0+ |

Service agent: `service-<messagingSenderId>@gcp-sa-firebasevertexai.iam.gserviceaccount.com`
