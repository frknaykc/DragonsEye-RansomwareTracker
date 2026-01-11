#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
VECT Ransomware Parser
Parses victim data from VECT ransomware leak site
"""
import os
import re
from bs4 import BeautifulSoup
from datetime import datetime

def main():
    """Parse VECT HTML files and extract victim information"""
    victims = []
    
    # Find all VECT HTML files
    for filename in os.listdir('../tmp'):
        if filename.startswith('vect-') and filename.endswith('.html'):
            filepath = os.path.join('../tmp', filename)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    html = f.read()
                
                soup = BeautifulSoup(html, 'html.parser')
                
                # Find all victim cards
                victim_cards = soup.find_all('div', class_='victim-card')
                
                for card in victim_cards:
                    try:
                        # Get company name from h3 in header
                        header = card.find('div', class_='card-header-warning')
                        name_elem = header.find('h3') if header else None
                        name = name_elem.get_text(strip=True) if name_elem else None
                        
                        if not name:
                            continue
                        
                        # Get status
                        status_elem = card.find('p', class_='status-tag')
                        status = status_elem.get_text(strip=True) if status_elem else ''
                        
                        # Get body info
                        body = card.find('div', class_='card-body')
                        
                        # Get date
                        date_elem = body.find('p', class_='date-info') if body else None
                        date_text = date_elem.get_text(strip=True) if date_elem else ''
                        
                        # Parse date (format: "ENTRY 01 | 05 Jan 2026")
                        discovered = None
                        date_match = re.search(r'(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})', date_text)
                        if date_match:
                            day, month, year = date_match.groups()
                            month_num = {'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 
                                        'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
                                        'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'}[month]
                            discovered = f"{year}-{month_num}-{day.zfill(2)}"
                        
                        # Get metadata (sector, country, site)
                        meta_elem = body.find('p', class_='card-meta') if body else None
                        meta_text = meta_elem.get_text(strip=True) if meta_elem else ''
                        
                        # Parse sector
                        sector_match = re.search(r'SECTOR:\s*([^•]+)', meta_text)
                        sector = sector_match.group(1).strip() if sector_match else ''
                        
                        # Parse country
                        country_match = re.search(r'COUNTRY:\s*([^•]+)', meta_text)
                        country = country_match.group(1).strip() if country_match else ''
                        
                        # Parse website
                        site_match = re.search(r'SITE:\s*(\S+)', meta_text)
                        website = site_match.group(1).strip() if site_match else ''
                        
                        # Get description (paragraph after meta)
                        description_elem = body.find_all('p') if body else []
                        description = ''
                        for p in description_elem:
                            if 'card-meta' not in p.get('class', []) and 'date-info' not in p.get('class', []):
                                text = p.get_text(strip=True)
                                if text and not text.startswith('DATA SIZE'):
                                    description = text
                                    break
                        
                        # Build victim entry
                        victim = {
                            'post_title': name,
                            'group_name': 'vect',
                            'discovered': discovered or datetime.now().strftime('%Y-%m-%d'),
                            'description': f"{status} | Sector: {sector} | {description}".strip(' |'),
                            'website': website,
                            'country': country,
                            'activity': sector
                        }
                        
                        victims.append(victim)
                        print(f"  + {name} ({discovered})")
                        
                    except Exception as e:
                        print(f"  Error parsing card: {e}")
                        continue
                        
            except Exception as e:
                print(f"Error reading {filename}: {e}")
    
    return victims

if __name__ == "__main__":
    results = main()
    print(f"\nTotal victims found: {len(results)}")

