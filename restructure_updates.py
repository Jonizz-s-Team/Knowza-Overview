"""
Fix remaining issues:
1. v2.7.5: "### 🤖 Knowza AI" inside LMS block -> break out as "## 🤖 Knowza AI"
2. v2.8.0: "### 🤖 Knowza AI" inside LMS block -> break out as "## 🤖 Knowza AI"  
3. All files: ensure "## 🏫 Knowza LMS" block only contains "### 🏫 Frontend" and "### 🏫 Backend"
4. Fix any remaining garbled ## ?? headers
"""
import re
import os
import glob

UPDATES_DIR = r"c:\Users\User\Desktop\Knowza-Overview\updates"

def fix_file(path):
    with open(path, encoding="utf-8") as f:
        content = f.read()

    original = content

    # Fix "### 🤖 Knowza AI" that sits INSIDE ## 🏫 Knowza LMS block
    # -> Change to "## 🤖 Knowza AI" and add separator
    # The pattern: inside LMS block there's a "### 🤖 Knowza AI"
    # We insert "---\n\n## 🤖 Knowza AI\n\n" replacing "### 🤖 Knowza AI"
    content = re.sub(
        r'\n### 🤖 Knowza AI\n',
        '\n---\n\n## 🤖 Knowza AI\n',
        content
    )

    # Fix garbled emoji headers
    content = re.sub(r'## \?\? Knowza LMS', '## 🏫 Knowza LMS', content)
    content = re.sub(r'## \?\? Knowza AI', '## 🤖 Knowza AI', content)
    content = re.sub(r'## \?\? Release Goal', '## 🎯 Release Goal', content)
    content = re.sub(r'## \?\? Features', '## 🛠 Features', content)
    content = re.sub(r'## \?\? Deletions', '## 🗑 Deletions', content)
    content = re.sub(r'## \?\? Architecture', '## 📐 Architecture', content)
    content = re.sub(r'## \?\? Cleanups', '## 🗑 Cleanups', content)
    content = re.sub(r'## \?\? Stats', '## 📊 Stats', content)
    content = re.sub(r'### \?\? Frontend', '### 🏫 Frontend', content)
    content = re.sub(r'### \?\? Backend', '### 🏫 Backend', content)
    content = re.sub(r'### \?\? Knowza AI', '### 🤖 Knowza AI', content)
    content = re.sub(r'### \?\? First AI', '### ⭐ First AI', content)

    # Ensure --- separator before ## 🤖 Knowza AI if not already there
    content = re.sub(r'(?<!---\n)\n## 🤖 Knowza AI', '\n---\n\n## 🤖 Knowza AI', content)
    # Clean up double ---
    content = re.sub(r'---\n\n---\n', '---\n', content)

    if content != original:
        with open(path, "w", encoding="utf-8", newline="\r\n") as f:
            f.write(content)
        print(f"Fixed: {os.path.basename(path)}")
    else:
        print(f"Clean: {os.path.basename(path)}")

files = sorted(glob.glob(os.path.join(UPDATES_DIR, "update_v*.md")))
for f in files:
    fix_file(f)
print("\nAll done!")
