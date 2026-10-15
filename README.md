# Battery — Daily Mood & Energy

A small, installable web app for checking in on your social battery through the day.
Log an activity and answer five quick questions (energy, mood, fulfillment, hope,
connectedness) to get a battery score from 0 to 4. You can also log "red flag" moments,
see your trends and insights, and share your current battery with friends.

Your entries are stored on your device. Only the friends feature (optional) sends anything
online: your name and animal, your latest battery score, the activity, when you logged it,
your red flag moments from the past two weeks (with their notes, unless you turn notes off),
and the messages you send.

## Features

- **Log:** pick an activity, answer the check-in questions, save. A red flag button logs a 0 instantly.
- **Data:** day-by-day chart and entries (tap **Edit** to fix one), auto-generated insights,
  a logging streak, week / month / 3-month trends with a breakdown of the five check-in scores,
  and averages by activity.
- **Friends:** pick an animal avatar, send friend requests by code or invite link (both people
  have to agree), find friends of friends under "People you may know", see each friend's
  latest battery and red flags, and message friends directly.
- **Backup:** export / import a JSON file to move to a new phone. The backup also carries your
  friends identity, so keep it private.
- Works offline and installs to your home screen.

## Publish on GitHub Pages

1. Make sure the code is on the `main` branch.
2. On GitHub, open the repository's **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**, pick
   **`main`** and **`/ (root)`**, then **Save**.
4. After a minute or two the site is live at **https://nate-313.github.io/Social-Battery/**.
5. On your phone, open that link, then use **Share → Add to Home Screen** (iPhone, Safari)
   or **Install app** (Android, Chrome).

Each push to `main` redeploys automatically. Installed copies pick up a new version the
second time they're opened after the deploy.

## Set up Friends (Supabase, free)

The friends feature needs a small online database. Until it's set up, the Friends tab
just says "Not set up yet" and everything else works normally.

1. Create a free account at [supabase.com](https://supabase.com) and click **New project**.
   Any name, database password and region are fine.
2. When the project is ready, open **SQL Editor**, paste the entire contents of
   [`supabase/schema.sql`](supabase/schema.sql), and click **Run**.
3. Open **Project Settings → API** (or **API Keys**) and copy:
   - the **Project URL** (looks like `https://abcdefghijkl.supabase.co`), and
   - the **anon** / **publishable** key.
4. Paste them into [`config.js`](config.js):

   ```js
   window.BATTERY_CONFIG = {
     supabaseUrl: 'https://abcdefghijkl.supabase.co',
     supabaseAnonKey: 'your-anon-or-publishable-key',
   };
   ```

5. Commit and push to `main`. It's fine for this key to be public: the database only
   allows the app's own functions, which never reveal anyone's activity details or secret.

**After an app update that changes Friends,** run `supabase/schema.sql` in the SQL Editor
again. It's safe to re-run: it keeps everyone's profiles, friends and messages. If the app
says "The friends database needs an update", this is the step it means.

Supabase pauses free projects after about a week with no activity; if friends stop loading,
open the Supabase dashboard and click **Restore project**.

### How friends work

- Tap **Start sharing**, pick a name and an animal. You get a six-character friend code.
- Send your code (or tap **Share** for an invite link). Adding someone sends them a friend
  request; you become friends once they tap **Accept**. If you both send requests to each
  other, you become friends right away.
- **People you may know** lists friends of your friends, with the friends you have in
  common. Tap **Add** to send a request.
- Friends see your most recent entry and **every red flag moment** from the past 14 days.
  The note you write with a red flag is shared too, unless you turn off **Include the note I
  write with each red flag**. Activity details and check-in answers are never shared.
- Tap a friend to open your messages with them. Messages refresh every few seconds while
  open, and a red badge on the Friends tab shows unread messages and new requests.
- Messages are stored in your Supabase database so both phones can see them; anyone with
  access to your Supabase dashboard can read them.
- There are no accounts: your device holds a random secret that identifies you. To move
  to a new phone, export a backup and import it there. **Stop sharing** deletes your
  profile, friends, requests and messages from the database.

## Files

| File | What it is |
|---|---|
| `index.html` | The whole app (HTML, CSS, JavaScript) |
| `config.js` | Supabase settings for the friends feature |
| `supabase/schema.sql` | Database tables and functions for friends |
| `sw.js` | Service worker for offline use |
| `manifest.json`, `icon-*` | Home-screen install metadata and icons |
