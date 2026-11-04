GPK CRICKET LIVE SCOREBOARD — SETUP

This version syncs team names and score live between devices using Firebase Realtime Database.
The website itself can be hosted on Netlify (or Firebase Hosting). Firebase stores the live match data.

1. Create a Firebase project at https://console.firebase.google.com/
2. Add a Web App in Project settings and copy its Firebase config.
3. In Firebase Console > Realtime Database, create a database. Copy its database URL.
4. In Authentication > Sign-in method, enable Email/Password.
5. In Authentication > Users, add the scorer email and password.
6. In Realtime Database > Rules, use these rules for a public-viewer / signed-in-scorer setup:

{
  "rules": {
    ".read": true,
    ".write": "auth != null"
  }
}

7. Open script.js and replace every PASTE_YOUR_... value in firebaseConfig with your actual Firebase web-app config.
8. Publish the folder (index.html, style.css, script.js) using Netlify Drop:
   https://app.netlify.com/drop
   Drag the whole folder (or its contents) into the drop area.
9. Share the Netlify URL with everyone. They can see the live score without logging in.
10. The scorer opens the same link, taps SCORER LOGIN, and enters the email/password you created in Firebase.

IMPORTANT:
- Only the scorer account can update the score. Everyone else is a read-only viewer.
- Do not change the database rules to allow public writes.
- The Firebase web config is intended to be included in a website; database rules protect writes.
- Keep the scorer password private. Anyone with it can change the score.
