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
    .filter(file => file.name.endsWith('.md'))
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
    const html = marked.parse(text);
    const article = document.createElement('article');

    const dateMatch = text.match(/<small>Posted on (.+?)<\/small>/);
    const postedOn = dateMatch ? dateMatch[1] : '';

    const previewLimit = 300;
    if (text.length > previewLimit) {
      const previewText = text.slice(0, previewLimit);
      const previewHTML = marked.parse(previewText + '...');

      article.innerHTML = `
        <div class="preview">${previewHTML}</div>
        <div class="full-content" style="display: none;">${html}</div>
        <button class="read-more">Read more</button>
        <div class="post-date"><small>Posted on ${postedOn}</small></div>
      `;

      article.querySelector('.read-more').addEventListener('click', function () {
        article.querySelector('.preview').style.display = 'none';
        article.querySelector('.full-content').style.display = 'block';
        this.style.display = 'none';
      });
    } else {
      article.innerHTML = `${html}<div class="post-date"><small>Posted on ${postedOn}</small></div>`;
    }

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