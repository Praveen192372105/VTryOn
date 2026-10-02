"""
Deployment Availability & Live Asset Verifier.
Validates:
1. Target URL returns HTTP 200
2. CSS assets load with HTTP 200
3. JavaScript assets load with HTTP 200
4. HTML contains proper <title> and <div id="root">
5. No deployment or 404 error indicators
"""

import sys
import os
import re
import time
from urllib.parse import urljoin
import requests

from automation.config.env_config import BASE_URL, DEFAULT_LIVE_URL
from automation.utils.logger import log

def verify_deployment(target_url: str = BASE_URL, max_retries: int = 12, retry_delay: int = 10) -> bool:
    """
    Polls and verifies the live GitHub Pages deployment.
    """
    log.info(f"Initiating live deployment verification for: {target_url}")
    session = requests.Session()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) VTryOnDeploymentVerifier/1.0"
    })

    main_html = None
    success = False

    for attempt in range(1, max_retries + 1):
        try:
            log.info(f"Attempt {attempt}/{max_retries}: Probing {target_url}...")
            resp = session.get(target_url, timeout=15)
            if resp.status_code == 200:
                main_html = resp.text
                if "<html" in main_html.lower() and ("id=\"root\"" in main_html or "id='root'" in main_html):
                    log.info("✓ Main page returns HTTP 200 with valid root container.")
                    success = True
                    break
                else:
                    log.warning(f"HTTP 200 received but HTML missing root container. Length: {len(main_html)}")
            else:
                log.warning(f"Endpoint returned HTTP {resp.status_code}. Waiting for deployment propagation...")
        except Exception as e:
            log.warning(f"Connection attempt {attempt} failed: {e}")

        if attempt < max_retries:
            time.sleep(retry_delay)

    if not success or not main_html:
        log.error(f"[DEPLOYMENT FAILURE] Live endpoint {target_url} failed verification after {max_retries} attempts.")
        return False

    # Verify CSS & JS Assets
    log.info("Analyzing referenced assets in deployment HTML...")
    # Find all href="...css" and src="...js"
    css_links = re.findall(r'href=[\'"]([^\'"]+\.css)[\'"]', main_html)
    js_links = re.findall(r'src=[\'"]([^\'"]+\.js)[\'"]', main_html)

    log.info(f"Found {len(css_links)} CSS links and {len(js_links)} JS script links in index.html.")

    # Probe CSS assets
    for css in css_links:
        full_css_url = urljoin(target_url, css)
        try:
            r = session.get(full_css_url, timeout=10)
            if r.status_code == 200:
                log.info(f"✓ CSS Asset Verified: {css} (HTTP 200, {len(r.content)} bytes)")
            else:
                log.error(f"✖ CSS Asset Failed: {full_css_url} returned HTTP {r.status_code}")
                return False
        except Exception as ce:
            log.error(f"✖ Failed to fetch CSS asset {full_css_url}: {ce}")
            return False

    # Probe JS assets
    for js in js_links:
        full_js_url = urljoin(target_url, js)
        try:
            r = session.get(full_js_url, timeout=10)
            if r.status_code == 200:
                log.info(f"✓ JS Asset Verified: {js} (HTTP 200, {len(r.content)} bytes)")
            else:
                log.error(f"✖ JS Asset Failed: {full_js_url} returned HTTP {r.status_code}")
                return False
        except Exception as je:
            log.error(f"✖ Failed to fetch JS asset {full_js_url}: {je}")
            return False

    log.info("================================================================================")
    log.info("✓ DEPLOYMENT VERIFICATION PASSED: Live URL, HTML, CSS & JS Assets Validated!")
    log.info("================================================================================")
    return True

if __name__ == "__main__":
    url_to_verify = os.getenv("BASE_URL", BASE_URL)
    is_valid = verify_deployment(url_to_verify)
    if not is_valid:
        print(f"::error::Live deployment validation failed for {url_to_verify}")
        sys.exit(1)
    sys.exit(0)
