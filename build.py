import markdown
from pathlib import Path

posts_dir = Path("posts")
index_file = Path("index.html")

all_posts = sorted(posts_dir.glob("*.md"), reverse=True)

html_posts = ""
for post in all_posts:
    md_content = post.read_text()
    html_content = markdown.markdown(md_content)
    html_posts += f"<article>{html_content}</article>\n<hr>\n"

index_html = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>My Microblog</title>
</head>
<body>
  <h1>My Microblog</h1>
  {html_posts}
</body>
</html>
"""

index_file.write_text(index_html)
