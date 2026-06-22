const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const mime = require('mime-types');

const app = express();
const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = path.join(__dirname, 'uploads');

// ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// serve static UI
app.use(express.static(path.join(__dirname, 'public')));

// multer storage & filter
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    // keep original name but remove path components
    const safeName = path.basename(file.originalname).replace(/\s+/g, '_');
    // avoid overwriting by prefixing a timestamp
    cb(null, `${Date.now()}_${safeName}`);
  }
});

function fileFilter(req, file, cb) {
  // accept common video mime types
  const allowed = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'];
  cb(null, allowed.includes(file.mimetype));
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 200 * 1024 * 1024 } // 200 MB limit
});

// API: list uploaded videos
app.get('/api/videos', (req, res) => {
  fs.readdir(UPLOAD_DIR, (err, files) => {
    if (err) return res.status(500).json({ error: 'Could not read uploads' });
    // return file metadata
    const videos = files
      .filter(Boolean)
      .map((f) => {
        const stats = fs.statSync(path.join(UPLOAD_DIR, f));
        return { name: f, size: stats.size, uploadedAt: stats.mtimeMs };
      })
      .sort((a, b) => b.uploadedAt - a.uploadedAt);
    res.json(videos);
  });
});

// API: upload a video (field name 'video')
app.post('/upload', upload.single('video'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No video uploaded or unsupported format' });
  res.json({ ok: true, filename: req.file.filename });
});

// Streaming endpoint with Range support: /video/:filename
app.get('/video/:filename', (req, res) => {
  const filename = path.basename(req.params.filename); // sanitize
  const filePath = path.join(UPLOAD_DIR, filename);
  if (!fs.existsSync(filePath)) return res.status(404).send('Not found');

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  const contentType = mime.lookup(filePath) || 'application/octet-stream';
  if (range) {
    // parse range "bytes=start-end"
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    if (isNaN(start) || isNaN(end) || start > end || end >= fileSize) {
      return res.status(416).header('Content-Range', `bytes */${fileSize}`).end();
    }
    const chunkSize = (end - start) + 1;
    res.status(206);
    res.set({
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': contentType
    });
    const stream = fs.createReadStream(filePath, { start, end });
    stream.pipe(res);
  } else {
    // full stream
    res.set({
      'Content-Length': fileSize,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes'
    });
    fs.createReadStream(filePath).pipe(res);
  }
});

// simple health
app.get('/health', (req, res) => res.send('OK'));

app.listen(PORT, () => console.log(`Server: http://localhost:${PORT}`));