# AI Quest — Temporary Public Testing Guide

> **⚠️ This is ONLY for temporary testing.**
> The tunnel URL is not permanent — it changes every time you restart the tunnel.
> This guide does NOT affect the main application in any way.

---

## 🛠 Prerequisites

Make sure you have these installed (already done):
- **Node.js** v14+ (`node --version`)
- **localtunnel** — installed globally (`lt --version`)

---

## 🚀 Step 1 — Start the AI Quest Server

Open a **Command Prompt** window in the project folder:

```
C:\Users\siva9\Downloads\Quiz\Quiz
```

Run:

```cmd
node server/index.js
```

You should see:

```
🚀 AI Quest server running at http://localhost:3000
   Admin login: admin@aiquest.com / Admin@123
```

**Keep this window open.** Do NOT close it.

---

## 🌐 Step 2 — Start the Temporary Public Tunnel

Open a **second Command Prompt** window (keep the first one running).

Run:

```cmd
lt --port 3000 --subdomain aiquest-test
```

You will see:

```
your url is: https://aiquest-test.loca.lt
```

**Keep this window open too.** Closing it stops the tunnel.

> **Note:** The subdomain `aiquest-test` is requested but not guaranteed.
> If it's taken, just run without `--subdomain`:
>
> ```cmd
> lt --port 3000
> ```
>
> And use whatever URL is printed (e.g. `https://some-random-name.loca.lt`).

---

## 📱 Step 3 — Share with Participants

Give participants this URL:

```
https://aiquest-test.loca.lt
```

### First-time browser warning (localtunnel protection page)

When participants open the link for the first time on their phone or browser,
localtunnel may show a "Friendly Reminder" page asking them to enter a **tunnel password**.

**To find the tunnel password:**

Run this in a third Command Prompt (one time only):

```cmd
curl https://loca.lt/mytunnelpassword
```

This prints your **current public IP address** — that is the password to enter on the loca.lt page.

After entering it once, the browser proceeds directly to AI Quest.

> **Tip:** Share the tunnel password with participants along with the URL.

---

## ✅ What Participants Can Do

Through the public URL, participants can:

- ✅ Open the quiz from **Android or iPhone**
- ✅ Register a new account
- ✅ Log in to an existing account
- ✅ View the participant dashboard
- ✅ Start the quiz (Round 1 → Round 2 → Round 3)
- ✅ Navigate between questions
- ✅ Submit answers round by round
- ✅ View their final score (out of 50 points)

---

## 🔴 Step 4 — Stop the Temporary Link

To stop the tunnel, press **Ctrl + C** in the second Command Prompt (the one running `lt`).

The URL immediately becomes inaccessible. The AI Quest server continues running normally.

To stop the server, press **Ctrl + C** in the first Command Prompt.

---

## 🔁 Step 5 — Restart Later

To restart for another session:

1. Start the server again:
   ```cmd
   node server/index.js
   ```
2. Start the tunnel again:
   ```cmd
   lt --port 3000 --subdomain aiquest-test
   ```
3. Share the printed URL with participants.

---

## 📋 Quick Reference

| Item | Value |
|------|-------|
| **Local URL** | `http://localhost:3000` |
| **Public Tunnel URL** | `https://aiquest-test.loca.lt` (or whatever is printed) |
| **Start server command** | `node server/index.js` |
| **Start tunnel command** | `lt --port 3000 --subdomain aiquest-test` |
| **Tunnel password source** | Run `curl https://loca.lt/mytunnelpassword` |
| **Admin login URL** | `https://aiquest-test.loca.lt/admin-login.html` |
| **Admin email** | `admin@aiquest.com` |
| **Conductor tool** | `https://aiquest-test.loca.lt/admin-login.html` |

---

## 🔒 Security Notes

- The tunnel is temporary and disappears when you close the terminal.
- No admin credentials or JWT secrets are exposed through the tunnel.
- Correct quiz answers are never sent to the browser — server-side only.
- The database file (`quiz.db.json`) is not served through any route.
- Only run the tunnel during testing — stop it when done.

---

## ❓ Troubleshooting

| Problem | Solution |
|---------|----------|
| `lt: command not found` | Run `npm install -g localtunnel` |
| Subdomain already taken | Remove `--subdomain aiquest-test`, use the random URL printed |
| Tunnel shows "blocked" page | Enter your IP (from `curl https://loca.lt/mytunnelpassword`) as the password |
| API calls fail | Make sure the **server** is running first, then start the tunnel |
| Participants see a blank page | Make sure BOTH the server AND tunnel windows are open |
| Tunnel disconnects randomly | Restart with `lt --port 3000` again |
