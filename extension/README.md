# Client Hunter Extension
Load unpacked: chrome://extensions -> Developer mode -> Load unpacked -> select `extension/` folder.
Set API URL in popup.js to production (NEXT_PUBLIC_APP_URL).
Auth: generates session token via POST /api/extension/session (requires logged-in CRM user). Stored in chrome.storage.local.
