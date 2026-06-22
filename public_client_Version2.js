(async function () {
  const videosEl = document.getElementById('videos');
  const player = document.getElementById('videoPlayer');
  const videoSource = document.getElementById('videoSource');
  const currentName = document.getElementById('currentName');
  const uploadForm = document.getElementById('uploadForm');
  const fileInput = document.getElementById('videoFile');
  const uploadMsg = document.getElementById('uploadMsg');

  async function fetchVideos() {
    const res = await fetch('/api/videos');
    const list = await res.json();
    videosEl.innerHTML = '';
    if (list.length === 0) videosEl.innerHTML = '<li class="muted">No videos yet — upload one above.</li>';
    list.forEach(v => {
      const li = document.createElement('li');
      li.textContent = `${v.name} (${(v.size/1024/1024).toFixed(2)} MB)`;
      li.addEventListener('click', () => playVideo(v.name));
      videosEl.appendChild(li);
    });
  }

  function playVideo(filename) {
    const url = `/video/${encodeURIComponent(filename)}`;
    // set source and load
    videoSource.src = url;
    // set type from filename extension for better compatibility
    const ext = filename.split('.').pop().toLowerCase();
    if (ext === 'webm') videoSource.type = 'video/webm';
    else if (ext === 'mp4') videoSource.type = 'video/mp4';
    else if (ext === 'mov') videoSource.type = 'video/quicktime';
    else videoSource.type = '';
    player.load();
    currentName.textContent = filename;
    player.play().catch(() => {});
  }

  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    uploadMsg.textContent = '';
    const file = fileInput.files[0];
    if (!file) {
      uploadMsg.textContent = 'Pick a video file first.';
      return;
    }
    const fd = new FormData();
    fd.append('video', file);
    uploadMsg.textContent = 'Uploading...';
    try {
      const res = await fetch('/upload', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Upload failed');
      uploadMsg.textContent = 'Upload successful';
      fileInput.value = '';
      await fetchVideos();
      // auto-play newly uploaded video
      playVideo(json.filename);
    } catch (err) {
      uploadMsg.textContent = 'Error: ' + err.message;
    }
    setTimeout(() => { uploadMsg.textContent = ''; }, 3000);
  });

  // initial load
  fetchVideos();
})();