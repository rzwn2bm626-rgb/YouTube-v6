# Mini YouTube (local)

Minimal video upload + streaming app.

Prereqs:
- Node.js (v16+ recommended)
- A browser that supports HTML5 video

Install & run:
1. Save files into a folder.
2. npm install
3. npm start
4. Open http://localhost:3000

Usage:
- Use the upload form to upload an MP4/WebM/MOV file (max 200MB by default).
- Click a video in the list to play it. Seeking is supported.

Notes & next steps:
- This is for demo/local use only. If you deploy publicly, add authentication, virus scanning, rate limiting, and storage beyond local disk (S3, GCS).
- You can add thumbnails, metadata (title/description), transcoding, or playlists.