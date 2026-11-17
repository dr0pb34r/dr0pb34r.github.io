#!/usr/bin/env python3
import os
import re

WIKI_DIR = "wiki"

def slugify(text):
    # Convert spaces/hyphens/underscores to lowercase separated by single hyphens
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s_-]', '', text)
    text = re.sub(r'[\s_-]+', '-', text)
    return text.strip('-')

def main():
    if not os.path.exists(WIKI_DIR):
        print(f"Wiki directory '{WIKI_DIR}' does not exist.")
        return

    print("Running wiki Obsidian preprocessor...")
    modified_count = 0

    for root, dirs, files in os.walk(WIKI_DIR):
        for file in files:
            if not file.endswith(".md"):
                continue

            filepath = os.path.join(root, file)
            # Skip wiki index file
            if file == "index.md" and root == WIKI_DIR:
                continue

            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()

                # Check if it already has YAML front matter
                has_front_matter = content.startswith("---")
                
                if not has_front_matter:
                    # Parse filename for default title
                    name_without_ext = os.path.splitext(file)[0]
                    # Replace dashes/underscores with spaces for title
                    title = name_without_ext.replace("-", " ").replace("_", " ")
                    title = title.title() # Capitalize words
                    
                    # Create url-friendly permalink
                    slug = slugify(name_without_ext)
                    permalink = f"/wiki/{slug}/"
                    
                    # Construct front matter
                    front_matter = f"---\nlayout: wiki\ntitle: \"{title}\"\npermalink: {permalink}\n---\n\n"
                    
                    # Prepend to content
                    new_content = front_matter + content
                    
                    with open(filepath, "w", encoding="utf-8") as f:
                        f.write(new_content)
                    
                    print(f"Added front matter to: {filepath} (Title: '{title}', Permalink: '{permalink}')")
                    modified_count += 1
            except Exception as e:
                print(f"Error processing {filepath}: {e}")

    print(f"Wiki preprocessing completed. Modified {modified_count} file(s).")

if __name__ == "__main__":
    main()
