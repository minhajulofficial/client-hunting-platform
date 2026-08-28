# USER MANUAL — Client Hunter CRM

For non-developers. Follow in order.

**Your CRM:** https://client-hunting-platform-five.vercel.app

---

## A. First login

1. Open the CRM link above.
2. Click **Login with Google**.
3. Choose your Google account and approve.
4. You land on the **Dashboard**.

If you are bounced back to the login page, your email is not in the allow-list. The owner must add it to the `ADMIN_EMAILS` environment variable in Vercel and redeploy.

---

## B. Connect Gmail

1. Left menu → **Integrations**.
2. In the **Gmail** card press **Connect Gmail**.
3. Approve the Google permission screen (send + read email).
4. You return to the CRM and the card shows **Connected ✓**.
5. Press **Test Gmail Connection** — it must say Connected.
6. Type your own address in the test box and press **Send Test Email**. Check your inbox.

Sending campaigns is only safe after the test email actually arrives.

If the card shows **NOT CONFIGURED**, the Google API keys are missing — see `docs/DEVELOPER_SETUP.md`.

---

## C. Install the Chrome extension

1. Open `chrome://extensions`.
2. Turn on **Developer mode** (top-right).
3. Click **Load unpacked**.
4. Select the `extension` folder from the project.
5. Pin the 🎯 **Client Hunter** icon.

---

## D. Connect the extension

1. Stay logged into the CRM in the same Chrome profile.
2. Click the 🎯 icon.
3. If your CRM is on a different address: click **CRM URL**, paste it, press **Save CRM URL**.
4. Press **Connect to CRM**.
5. Press **Test Connection**. You should see:
   - API: **Connected ✓**
   - DB: **Connected ✓**
   - Auth: **Valid ✓**

If Auth says *No token*, press **Connect to CRM** again while logged in.

---

## E. Create a project

Left menu → **Projects** → fill the form on the right:

| Field | Meaning | Example |
|---|---|---|
| Project name | Your campaign group | USA Dental Outreach |
| Country | Country you target | USA |
| City | City you target | Miami |
| Niche | Type of business | Dental Clinic |

Press **Create Project**. Every lead belongs to a project.

---

## F. Find leads

1. Open a **business website** in Chrome (e.g. a dental clinic's site or its contact page).
2. Click the 🎯 icon.
3. Choose your **Project** (required).
4. Fill Country / State / City / Niche / Target Position / Service.
5. Press **START HUNT**.

The status line moves through: `SEARCHING → COLLECTING → PROCESSING → VALIDATING → READY`.

The extension reads only information the website shows publicly (business name, email, phone, address, social links). It never bypasses logins, CAPTCHAs or paywalls.

If the page has no public contact details you will see **"No public business data found on this page."** — that is honest, not an error. Try the site's Contact page.

---

## G. Import leads

1. Review the preview table (Business / Email / Source).
2. Untick anything you do not want, or use **Select All** / **Deselect**.
3. Press **Import Selected**.

You get a real result from the server:

```
Import Complete ✓
Received: 1
Imported: 1
Duplicates: 0
Possible duplicates: 0
Failed: 0
```

Duplicates are detected by email, phone, website domain and business name. Possible duplicates are imported with status **REVIEW** so you can check them.

Open **Leads** in the CRM — the lead is there.

---

## H. Verify leads

Open a lead → **Re-verify** in the verification box.

| Status | Meaning |
|---|---|
| **VERIFIED** | Syntax, domain and business-domain checks passed |
| **RISKY** | Works but is a free provider (gmail/yahoo) or unusual |
| **INVALID** | Not a usable address — never emailed |
| **UNKNOWN** | Not checked yet |

Nothing is ever labelled "100% real". The **score (0-100)** combines email, phone, website and social signals.

---

## I. Generate an AI message

1. Left menu → **AI**.
2. Edit the system instruction and template if you want.
3. Press **Generate with AI**.

If `AI_API_KEY` is not set, the system runs in **free mode**: it fills your variables with real lead data and does **not** invent facts. The response tells you which provider was used.

---

## J. Send one email

1. Open a lead (must have an email address).
2. In **Send email**: check To / Subject / Message.
3. Optionally press **Generate with AI** or **Personalize**.
4. Press **Send**.

With Gmail connected the message is sent through the Gmail API and the lead becomes **CONTACTED**. Without Gmail the response clearly says *queued*, not "sent".

---

## K. Bulk campaign

1. **Campaigns** → type a name → **Create Campaign**.
2. **Leads** → select leads → add them to the campaign.
3. Open the campaign — you see **Queued / Sent / Failed / Replied**.
4. Press **Start Queue** and confirm the count.

Only **VERIFIED** and **RISKY** addresses are used. INVALID, UNSUBSCRIBED, NOT_INTERESTED and WON leads are skipped. Messages are paced to respect Gmail limits.

---

## L. Check replies

1. Left menu → **Inbox**.
2. Press **Sync Gmail**.

Replies from the last 7 days are matched to your leads. A matched lead becomes **REPLIED** and the conversation appears in the Inbox. Nothing is invented — an empty Inbox means no replies were found.

---

## M. Follow-ups

Set **Next follow-up** on a lead, or use campaign steps (Day 0 / Day 3 / Day 7).

Automatic outreach stops immediately when a lead becomes **REPLIED**, **UNSUBSCRIBED**, **NOT_INTERESTED** or **WON**.

---

## N. Troubleshooting

| Problem | What to do |
|---|---|
| **Extension not connecting** | Log into the CRM in the same Chrome profile → popup → **Connect to CRM** → **Test Connection**. Check **CRM URL** matches your site. |
| **API says Failed ✕** | Wrong CRM URL, or the site is down. Open the CRM in a tab to confirm. |
| **DB says NOT CONFIGURED** | Supabase environment variables are missing in Vercel. See `docs/DEVELOPER_SETUP.md`. |
| **Gmail disconnected** | Integrations → **Connect Gmail** again. Tokens expire if access is revoked. |
| **AI not responding** | Check **Integrations → AI provider**. Free mode works without a key; errors show the real provider message. |
| **Lead import failed** | The red message shows the exact reason (validation or database). Fix and retry. |
| **Source not supported** | Only the website adapter extracts live data today. Open the business site or its contact page. |
| **No data found** | The page genuinely has no public contact details. Try the Contact/About page. |
| **Duplicate detected** | The lead already exists. Search for it in **Leads**. |
| Anything else | **Admin Logs** (user events + system errors) and **Admin → System Health**. |

---

## Data ownership

- **Export:** Leads page → **Export filtered** (CSV).
- **Delete:** delete a lead, project or campaign from its page.
- **Disconnect:** Integrations → Gmail, or extension → **Disconnect**.
