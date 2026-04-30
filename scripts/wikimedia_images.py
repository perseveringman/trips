#!/usr/bin/env python3
"""
Wikimedia Commons 批量搜图脚本
为缺少配图的实体从 Wikimedia Commons 搜索合适图片
"""

import os
import re
import json
import urllib.request
import urllib.parse
import time

ENTITIES_DIR = "/workspace/trips/trips/egypt-2026-05/wiki/entities"

# 19 个需要补图的实体 → 英文搜索关键词（精确匹配内容）
SEARCH_MAP = {
    "丹德拉神庙": "Dendera Temple complex Egypt",
    "克利奥帕特拉七世": "Cleopatra VII Egypt bust",
    "卡夫拉": "Khafre pharaoh statue",
    "卡尔纳克神庙": "Karnak temple Luxor",
    "卢克索": "Luxor Temple Egypt",
    "哈布城": "Medinet Habu temple Egypt",
    "哈特谢普苏特": "Hatshepsut temple Deir el-Bahari",
    "大埃及博物馆": "Grand Egyptian Museum Giza",
    "尼罗河落日帆船": "Felucca Nile sunset Luxor",
    "帝王谷": "Valley of the Kings entrance Egypt",
    "拉美西斯三世": "Ramesses III Medinet Habu",
    "拉美西斯二世": "Ramesses II Abu Simbel",
    "洞穴教堂": "Cave Church Mokattam Cairo",
    "狮身人面像": "Great Sphinx of Giza",
    "穆罕默德·阿里": "Muhammad Ali Mosque Cairo citadel",
    "萨拉丁": "Saladin portrait",
    "萨拉丁城堡": "Cairo Citadel Saladin Egypt",
    "门农巨像": "Colossi of Memnon Luxor",
    "阿蒙霍特普三世": "Amenhotep III statue",
}

def search_commons(query, limit=5):
    """Search Wikimedia Commons for images matching query"""
    params = {
        "action": "query",
        "format": "json",
        "generator": "search",
        "gsrnamespace": "6",  # File namespace
        "gsrsearch": query,
        "gsrlimit": str(limit),
        "prop": "imageinfo",
        "iiprop": "url|extmetadata|size",
        "iiurlwidth": "800",
    }
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params)
    
    req = urllib.request.Request(url, headers={
        "User-Agent": "TravelCompanionBot/1.0 (travel-companion@trips.app)"
    })
    
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode())
    except Exception as e:
        print(f"  API error: {e}")
        return []
    
    pages = data.get("query", {}).get("pages", {})
    results = []
    for page_id, page in pages.items():
        ii = page.get("imageinfo", [{}])[0]
        title = page.get("title", "")
        # Skip SVGs, GIFs, very small images
        if any(title.lower().endswith(ext) for ext in [".svg", ".gif", ".ogg", ".ogv", ".webm"]):
            continue
        width = ii.get("width", 0)
        if width < 400:
            continue
        
        thumb_url = ii.get("thumburl", "")
        source_url = ii.get("descriptionurl", "")
        
        # Get artist/credit from extmetadata
        extmeta = ii.get("extmetadata", {})
        artist = extmeta.get("Artist", {}).get("value", "")
        # Strip HTML tags from artist
        artist = re.sub(r'<[^>]+>', '', artist).strip()
        license_name = extmeta.get("LicenseShortName", {}).get("value", "")
        description = extmeta.get("ImageDescription", {}).get("value", "")
        description = re.sub(r'<[^>]+>', '', description).strip()
        
        results.append({
            "title": title,
            "thumb_url": thumb_url,
            "source_url": source_url,
            "artist": artist,
            "license": license_name,
            "description": description,
            "width": width,
        })
    
    return results

def verify_url(url):
    """HEAD request to verify URL is accessible"""
    try:
        req = urllib.request.Request(url, method="HEAD", headers={
            "User-Agent": "TravelCompanionBot/1.0"
        })
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status == 200
    except:
        return False

def update_entity_file(entity_name, image_url, credit, source_url):
    """Update entity markdown file with image info"""
    filepath = os.path.join(ENTITIES_DIR, f"{entity_name}.md")
    if not os.path.exists(filepath):
        print(f"  File not found: {filepath}")
        return False
    
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Replace image: null with actual URL
    content = re.sub(r'^image: null$', f'image: "{image_url}"', content, flags=re.MULTILINE)
    content = re.sub(r'^imageCredit: null$', f'imageCredit: "{credit}"', content, flags=re.MULTILINE)
    
    # Add imageSource if not present
    if "imageSource:" in content:
        content = re.sub(r'^imageSource:.*$', f'imageSource: "{source_url}"', content, flags=re.MULTILINE)
    else:
        content = content.replace(f'imageCredit: "{credit}"', 
                                  f'imageCredit: "{credit}"\nimageSource: "{source_url}"')
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    
    return True

def main():
    results_log = []
    success_count = 0
    fail_count = 0
    
    for entity_name, search_query in SEARCH_MAP.items():
        print(f"\n{'='*60}")
        print(f"搜索: {entity_name} → '{search_query}'")
        print(f"{'='*60}")
        
        candidates = search_commons(search_query)
        time.sleep(0.5)  # Be polite to the API
        
        if not candidates:
            print(f"  ❌ 无搜索结果")
            fail_count += 1
            results_log.append({"entity": entity_name, "status": "no_results"})
            continue
        
        # Pick the first valid candidate
        chosen = None
        for i, c in enumerate(candidates):
            print(f"  [{i+1}] {c['title'][:60]}")
            print(f"      描述: {c['description'][:80]}")
            print(f"      作者: {c['artist'][:50]}")
            print(f"      许可: {c['license']}")
            
            if c['thumb_url'] and verify_url(c['thumb_url']):
                chosen = c
                print(f"  ✅ 选择 [{i+1}]")
                break
            else:
                print(f"      URL不可达，跳过")
        
        if chosen:
            credit = f"{chosen['artist']} / Wikimedia Commons / {chosen['license']}"
            if len(credit) > 120:
                credit = f"Wikimedia Commons / {chosen['license']}"
            
            if update_entity_file(entity_name, chosen['thumb_url'], credit, chosen['source_url']):
                print(f"  ✅ 已更新: {entity_name}")
                success_count += 1
                results_log.append({
                    "entity": entity_name,
                    "status": "success",
                    "url": chosen['thumb_url'],
                    "credit": credit,
                })
            else:
                fail_count += 1
                results_log.append({"entity": entity_name, "status": "file_error"})
        else:
            print(f"  ❌ 所有候选URL均不可达")
            fail_count += 1
            results_log.append({"entity": entity_name, "status": "url_failed"})
    
    print(f"\n\n{'='*60}")
    print(f"完成: {success_count} 成功, {fail_count} 失败")
    print(f"{'='*60}")
    
    # Save results log
    log_path = "/workspace/trips/scripts/wikimedia_results.json"
    with open(log_path, "w", encoding="utf-8") as f:
        json.dump(results_log, f, ensure_ascii=False, indent=2)
    print(f"结果日志: {log_path}")

if __name__ == "__main__":
    main()
