import os, datetime, sys, re
from bs4 import BeautifulSoup
from pathlib import Path
from dotenv import load_dotenv
from shared_utils import appender, errlog, find_slug_by_md5, extract_md5_from_filename
from urllib.parse import urljoin
from datetime import datetime


env_path = Path("../.env")
load_dotenv(dotenv_path=env_path)
home = os.getenv("RANSOMWARELIVE_HOME")
tmp_dir = Path(home + os.getenv("TMP_DIR"))


def main():
    script_path = os.path.abspath(__file__)
    if os.path.islink(script_path):
        original_path = os.readlink(script_path)
        if not os.path.isabs(original_path):
            original_path = os.path.join(os.path.dirname(script_path), original_path)
        group_name = os.path.basename(original_path).replace('.py','')
    else:
        group_name = os.path.basename(script_path).replace('.py','')

    for filename in os.listdir(tmp_dir):
        #try:
            if filename.startswith(group_name + '-'):
                html_doc = tmp_dir / filename
                with open(html_doc, 'r', encoding='utf-8') as file:
                    soup = BeautifulSoup(file, 'html.parser')

                    # Try new HTML structure first (div.card)
                    cards = soup.select("div.card")
                    if not cards:
                        # Fallback to old structure
                        cards = soup.select("article.article-card")
                    
                    for card in cards:
                        # New structure: div.card with h2.card-title
                        title_tag = card.select_one("h2.card-title span:not(.country-flag)")
                        if not title_tag:
                            # Old structure fallback
                            title_tag = card.select_one("h2 a")
                        
                        date_tag = card.select_one("div.card-meta")
                        if not date_tag:
                            date_tag = card.select_one("span.date")
                        
                        # Get description from card-summary or p tag
                        desc_items = card.select("div.card-summary-item")
                        if desc_items:
                            description_parts = []
                            for item in desc_items:
                                label = item.select_one(".card-summary-label")
                                value = item.select_one(".card-summary-value")
                                if label and value:
                                    description_parts.append(f"{label.get_text(strip=True)} {value.get_text(strip=True)}")
                            description = " | ".join(description_parts) if description_parts else ""
                        else:
                            desc_tag = card.select_one("p")
                            description = desc_tag.get_text(strip=True) if desc_tag else ""

                        if not title_tag or not date_tag:
                            continue

                        name = title_tag.get_text(strip=True)
                        
                        # Get URL from card link or construct it
                        link_tag = card.select_one("a.card-link, h2 a")
                        if link_tag:
                            relative_url = link_tag.get("href", "").strip()
                        else:
                            relative_url = ""
                        
                        base_url = find_slug_by_md5(group_name, extract_md5_from_filename(str(html_doc))) 
                        full_url = urljoin(base_url, relative_url) if relative_url else base_url
                        
                        raw_date = date_tag.get_text(strip=True)
                        # Extract date from "Published: 2026-01-04" format
                        if "Published:" in raw_date:
                            raw_date = raw_date.replace("Published:", "").strip()
                        # Use current time for time part
                        try:
                            date_part = datetime.strptime(raw_date, "%Y-%m-%d").date()
                            now = datetime.now()
                            full_datetime = datetime.combine(date_part, now.time())
                            published_date = full_datetime.strftime("%Y-%m-%d %H:%M:%S.%f")
                        except ValueError:
                            published_date = ""


                        appender(
                            victim=name,
                            group_name=group_name,
                            description=description,
                            website="",
                            published=published_date,
                            post_url=full_url,
                            country=""
                        )
        #except Exception as e:
        #    errlog(group_name + ' - parsing fail with error: ' + str(e) + ' in file: ' + filename)

if __name__ == "__main__":
    main()
