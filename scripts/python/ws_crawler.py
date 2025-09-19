import argparse
import shutil
import re
import json
import sys
import requests
from pathlib import Path
from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup, Tag

def get_root_dir() -> Path:
    """
    Determines the project root directory whether running from source (.py)
    or as a frozen executable (.exe).
    """
    if getattr(sys, 'frozen', False):
        # sys.executable is the path to the .exe file.
        return Path(sys.executable).parent.parent
    else:
        # __file__ is the path to the script file.
        return Path(__file__).resolve().parent

# --- Configuration ---
BASE_URL = "https://ws-tcg.com"
CARDLIST_URL = f"{BASE_URL}/cardlist/"
ROOT_DIR = get_root_dir()
ASSETS_SOURCE_DIR = ROOT_DIR / "assets-source"
JSON_OUTPUT_DIR = ROOT_DIR / "src" / "assets" / "card" / "data"

COLOR_MAP = {"yellow.gif": "黄色", "red.gif": "红色", "green.gif": "绿色", "blue.gif": "蓝色"}
TYPE_MAP = {"キャラ": "角色卡", "クライマックス": "高潮卡", "イベント": "事件卡"}

def setup_base_directories():
    """Ensures all necessary source and output directories exist."""
    print(f"准备源文件目录: {ASSETS_SOURCE_DIR}")
    print(f"准备JSON输出目录: {JSON_OUTPUT_DIR}")
    
    # Ensure asset source directories exist
    (ASSETS_SOURCE_DIR / "card-images").mkdir(parents=True, exist_ok=True)
    
    # --- New Directory Setup ---
    # Ensure JSON output directory exists
    JSON_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def setup_product_image_directory(product_id: str) -> Path:
    """Creates a clean image directory for a specific product ID."""
    image_dir = ASSETS_SOURCE_DIR / "card-images" / product_id
    if image_dir.exists():
        shutil.rmtree(image_dir)
    image_dir.mkdir()
    return image_dir

def determine_product_id(card_key: str, product_name_raw: str, rarity: str) -> str:
    """
    Determines the product ID based on card key, raw product name, and rarity.
    """
    base_id = card_key.split('-')[0].lower().replace('/', '-')
    name_lower = product_name_raw.lower()
    rarity_upper = rarity.upper()

    if 'pr' in name_lower:
        return f"{base_id}-pr"
    elif 'TD' in rarity_upper:
        return f"{base_id}-td"
    
    return base_id

def parse_card_row(row: Tag) -> dict | None:
    """Parses a <tr> tag into a structured card dictionary, ensuring all keys exist."""
    if not (h4_tag := row.find("h4")):
        return None

    # Initialize with default values to ensure structural consistency
    card_info = {
        "name": "-", "key": "-", "image_url": "", "product_name": "-", "type": "-", 
        "level": "-", "power": "-", "cost": "-", "rarity": "-", "trait": "-", 
        "color": "-", "soul": "-", "link": [], "effect": "-",
        # Temporary field for internal logic
        "product_name_raw": "" 
    }

    try:
        # --- Name, Key, and Product Name ---
        h4_spans = h4_tag.select("span.highlight_target")
        card_info["name"] = h4_spans[0].text.strip()
        raw_card_no = h4_spans[1].text.strip()
        card_info["key"] = re.sub(r'[A-Z]+$', '', raw_card_no)
        
        # Extract the raw product name string, which is the text after the first <a> tag
        if a_tag := h4_tag.find("a"):
            if sibling := a_tag.next_sibling:
                product_name_raw = str(sibling).strip()
                card_info["product_name_raw"] = product_name_raw
                # Clean the product name for JSON output (remove leading '-')
                cleaned_name = product_name_raw.lstrip('-').strip()
                card_info["product_name"] = cleaned_name if cleaned_name else "-"
        
        img_tag = row.select_one("th a img")
        if img_tag:
            card_info["image_url"] = f"{BASE_URL}{img_tag['src']}"

        # --- Extract to temp dict ---
        temp_data = {}
        for span in row.select("td span.unit"):
            text = span.text.strip()
            if text.startswith("種類："): temp_data["type"] = text.replace("種類：", "").strip()
            elif text.startswith("レベル："): temp_data["level"] = text.replace("レベル：", "").strip()
            elif text.startswith("パワー："): temp_data["power"] = text.replace("パワー：", "").strip()
            elif text.startswith("コスト："): temp_data["cost"] = text.replace("コスト：", "").strip()
            elif text.startswith("レアリティ："): temp_data["rarity"] = text.replace("レアリティ：", "").strip()
            elif text.startswith("特徴："): temp_data["trait"] = text.replace("特徴：", "").strip()
            elif "色：" in str(span) and (img := span.find("img")): temp_data["color_img"] = Path(img['src']).name
            elif "ソウル：" in str(span): temp_data["soul_count"] = str(span).count("soul.gif")
        
        # --- Standardize and assign ---
        card_info["type"] = TYPE_MAP.get(temp_data.get("type"), "-")
        level_str = temp_data.get("level", "-")
        card_info["level"] = int(level_str) if level_str.isdigit() else "-"
        power_str = temp_data.get("power", "-")
        card_info["power"] = int(power_str) if power_str.isdigit() else "-"
        cost_str = temp_data.get("cost", "-")
        card_info["cost"] = int(cost_str) if cost_str.isdigit() else "-"
        
        raw_rarity = temp_data.get("rarity", "-")
        card_info["rarity"] = 'PR-S' if raw_card_no.endswith('S') and raw_rarity == 'PR' else raw_rarity

        traits_text = temp_data.get("trait", "-")
        card_info["trait"] = [t.strip() for t in traits_text.split("・")] if traits_text not in ["-", "－"] else "-"
        
        color_img_name = temp_data.get("color_img")
        card_info["color"] = COLOR_MAP.get(color_img_name, "-") if color_img_name else "-"
        
        soul_count = temp_data.get("soul_count", 0)
        card_info["soul"] = soul_count if soul_count > 0 else "-"
        
        if effect_tag := row.select_one("td > span.highlight_target"):
            effect_text = effect_tag.decode_contents().strip().replace('\n', '')
            card_info["effect"] = effect_text if effect_text else "-"

    except (IndexError, AttributeError) as e:
        print(f"  ⚠️ 解析行时出错: {e} - 跳过此行。")
        return None

    return card_info

def download_image(url: str, save_path: Path):
    if not url: return
    try:
        response = requests.get(url, stream=True, timeout=15)
        response.raise_for_status()
        with open(save_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
    except requests.exceptions.RequestException as e:
        print(f"  ❌ 下载图片失败: {url}, 错误: {e}")

def link_cards(all_cards: dict) -> dict:
    print("\n🔗 正在进行卡片链接后处理...")
    card_keys = list(all_cards.keys())
    card_names = {key: data['name'] for key, data in all_cards.items()}
    total_cards = len(card_keys)
    
    for i, source_key in enumerate(card_keys):
        progress = i + 1
        print(f"\r   - 进度: {progress}/{total_cards} ({progress / total_cards:.1%})", end='')
        sys.stdout.flush()
        source_name = card_names[source_key]
        for target_key in card_keys:
            if source_name in all_cards[target_key].get("effect", ""):
                if source_key not in all_cards[target_key]['link']: all_cards[target_key]['link'].append(source_key)
                if target_key not in all_cards[source_key]['link']: all_cards[source_key]['link'].append(target_key)
    
    print("\n✅ 链接处理完成。")
    return all_cards

def scroll_to_bottom_and_wait(page):
    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    page.wait_for_load_state("networkidle", timeout=10000)

def main(target_series_name: str, target_product_name: str):
    setup_base_directories()
    products_data = {}

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            print("正在执行页面筛选操作...")
            page.goto(CARDLIST_URL, timeout=60000)
            page.locator(f"#titleNumberList a:text-is('{target_series_name}')").click()
            page.wait_for_selector("#prcard_filter_work_title", state="visible")
            page.locator("#prcard_filter_work_title").select_option(label=target_product_name)
            page.locator(".search-result-table tbody tr").first.wait_for(state="visible", timeout=15000)
            scroll_to_bottom_and_wait(page)
            print("✅ 筛选完成。")

            if "件該当しました" not in (result_text := page.locator("#searchResults .center").text_content()) or \
               not (match := re.search(r"(\d+)", result_text)) or int(match.group(1)) == 0:
                print("🟡 未找到任何卡片，脚本结束。")
                return

            print(f"发现 {match.group(1)} 条卡片记录。开始抓取...")
            
            current_page = 1
            while True:
                print(f"\n--- 正在处理第 {current_page} 页 ---")
                html = page.inner_html(".search-result-table")
                soup = BeautifulSoup(html, "lxml")
                
                rows = soup.select("tbody tr")
                total_rows_on_page = len(rows)
                
                for i, row in enumerate(rows):
                    progress = i + 1
                    print(f"\r   - 正在下载: {progress}/{total_rows_on_page} ({progress / total_rows_on_page:.1%})", end='')
                    sys.stdout.flush()

                    card = parse_card_row(row)
                    if not card: continue

                    product_id = determine_product_id(card["key"], card["product_name_raw"], card["rarity"])
                    
                    if product_id not in products_data:
                        image_dir = setup_product_image_directory(product_id)
                        products_data[product_id] = {"cards": {}, "image_dir": image_dir}

                    product_cards = products_data[product_id]["cards"]
                    key = card["key"]
                    
                    if key in product_cards:
                        product_cards[key]["rarity"].append(card["rarity"])
                    else:
                        card_to_store = card.copy()
                        card_to_store["rarity"] = [card["rarity"]]
                        del card_to_store["key"], card_to_store["image_url"], card_to_store["product_name_raw"]
                        product_cards[key] = card_to_store
                    
                    img_filename = f"{key.split('-')[-1]}{card['rarity']}.png".lower()
                    img_save_path = products_data[product_id]["image_dir"] / img_filename
                    download_image(card["image_url"], img_save_path)

                if (next_link := page.locator(".pager span.next a")).count() > 0:
                    next_link.first.click()
                    page.locator(".search-result-table tbody tr").first.wait_for(state="visible", timeout=15000)
                    scroll_to_bottom_and_wait(page)
                    current_page += 1
                else:
                    print("所有页面处理完毕。")
                    break
        except Exception as e:
            print(f"❌ 爬取过程中发生错误: {e}")
        finally:
            browser.close()

    # --- Post-processing and Writing ---
    all_cards_combined = {}
    for product in products_data.values():
        all_cards_combined.update(product["cards"])

    if all_cards_combined:
        link_cards(all_cards_combined)

    for product_id, data in products_data.items():
        json_filename = f"{product_id}.json"
        # --- Core Change: Use the new JSON_OUTPUT_DIR ---
        json_output_path = JSON_OUTPUT_DIR / json_filename
        
        product_specific_data = {key: all_cards_combined[key] for key in data["cards"]}
        
        print(f"\n💾 正在将 {len(product_specific_data)} 张卡片数据写入: {json_output_path}")
        with open(json_output_path, 'w', encoding='utf-8') as f:
            json.dump(product_specific_data, f, ensure_ascii=False, indent=2)
    
    print("\n🎉 爬取任务完成！")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="爬取 Weiss Schwarz 官网卡牌数据。")
    parser.add_argument("-s", "--series", required=True, help="系列官方全名")
    parser.add_argument("-p", "--product", required=True, help="补充包/产品官方全名")
    args = parser.parse_args()

    main(args.series, args.product)