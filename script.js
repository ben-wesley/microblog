const username = 'ben-wesley';
const repo = 'microblog';
const folder = 'posts';

let currentPage = 0;
let allPosts = [];
const postsPerPage = 30;

async function fetchPostsList() {
  const apiUrl = `https://api.github.com/repos/${username}/${repo}/contents/${folder}`;
  const res = await fetch(apiUrl);
  const files = await res.json();
  return files
    .filter(file => file.name.endsWith('.html'))
    .sort((a, b) => b.name.localeCompare(a.name)); // newest first
}

async function loadPage(page) {
  const postList = document.getElementById('posts');
  postList.innerHTML = '';
  const start = page * postsPerPage;
  const end = start + postsPerPage;
  const pagePosts = allPosts.slice(start, end);

for (const post of pagePosts) {
  const res = await fetch(post.download_url);
  const text = await res.text();
  const html = text;
  const article = document.createElement('article');

  // Extract post filename slug
  const slug = post.name.replace('.html', '');

  // Format date from filename
  const filenameDate = post.name.split('-').slice(0, 3).join('-') + ' ' + post.name.split('-').slice(3, 4)[0];
  const parsedDate = new Date(
    filenameDate.replace(/(\d{4})-(\d{2})-(\d{2}) (\d{4})/,
      (_, y, m, d, hm) => `${y}-${m}-${d}T${hm.slice(0, 2)}:${hm.slice(2)}:00`)
  );
  const postedOn = parsedDate.toLocaleString('en-US', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  // Show preview if long
  const previewLimit = 300;
  if (text.length > previewLimit) {
    const previewText = text.slice(0, previewLimit);
    article.innerHTML = `
      <div class="preview">${previewText}...</div>
      <div class="full-content" style="display: none;">${html}</div>
      <button class="read-more">Read more</button>
      <div class="post-date"><small><a href="/${post.name}" class="posted-link">Posted on ${postedOn}</a></small></div>
    `;
    article.querySelector('.read-more').addEventListener('click', function () {
      article.querySelector('.preview').style.display = 'none';
      article.querySelector('.full-content').style.display = 'block';
      this.style.display = 'none';
    });
  } else {
    article.innerHTML = `${html}<div class="post-date"><small><a href="/posts/${post.name}" class="posted-link">Posted on ${postedOn}</a></small></div>`;
  }

  // 🔧 COMMENT DISPLAY
  const commentsDiv = document.createElement('div');
  commentsDiv.innerHTML = `<h4>Comments</h4>`;
  article.appendChild(commentsDiv);

  const commentFile = `${slug}.json`;
  const commentsUrl = `https://raw.githubusercontent.com/${username}/${repo}/main/comments/${commentFile}`;

  try {
    const commentRes = await fetch(commentsUrl);
    const commentData = await commentRes.json();

    commentData.forEach(c => {
      const el = document.createElement('div');
      el.innerHTML = `<hr><small>${new Date(c.timestamp).toLocaleString()}</small><br>${c.comment}`;
      commentsDiv.appendChild(el);
    });
  } catch (e) {
    // no comments yet
  }

  // 📝 COMMENT FORM
  const commentForm = document.createElement('form');
  commentForm.innerHTML = `
    <textarea placeholder="Leave a comment..." rows="3" style="width: 100%;"></textarea>
    <button type="submit">Submit</button>
    <div class="comment-status" style="font-size: 0.9em;"></div>
  `;

  commentForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const comment = commentForm.querySelector('textarea').value.trim();
    const status = commentForm.querySelector('.comment-status');
    if (!comment) {
      status.textContent = 'Comment cannot be empty.';
      return;
    }

    status.textContent = 'Submitting...';

    const res = await fetch('https://script.google.com/macros/s/AKfycbzzkCVNZ2IfZoSi9rlh6V1BwRzqYPvl6XQMF4xGhwSYzmGJa0_4MGEBlwOxyJWkmTZ6QQ/exec', {
      method: 'POST',
      body: JSON.stringify({ slug: slug, comment }),
      headers: { 'Content-Type': 'application/json' }
    });

    const json = await res.json();
    if (json.status === 'ok') {
      status.textContent = 'Comment added!';
      commentForm.querySelector('textarea').value = '';
    } else {
      status.textContent = 'Failed to submit comment.';
    }
  });

  article.appendChild(commentForm);
  postList.appendChild(article);
}


  updatePaginationControls();
}

function updatePaginationControls() {
  const nav = document.getElementById('pagination');
  nav.innerHTML = '';

  if (currentPage > 0) {
    const newer = document.createElement('button');
    newer.textContent = '← Newer';
    newer.onclick = () => {
      currentPage--;
      loadPage(currentPage);
    };
    nav.appendChild(newer);
  }

  if ((currentPage + 1) * postsPerPage < allPosts.length) {
    const older = document.createElement('button');
    older.textContent = 'Older →';
    older.onclick = () => {
      currentPage++;
      loadPage(currentPage);
    };
    nav.appendChild(older);
  }
}

// Load Marked.js and then load the posts
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
script.onload = async () => {
  allPosts = await fetchPostsList();
  loadPage(currentPage);
};
document.body.appendChild(script);
