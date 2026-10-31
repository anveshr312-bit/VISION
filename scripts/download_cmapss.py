#!/usr/bin/env python3
"""
VISION: NASA C-MAPSS Dataset Automated Ingestion & Verification
Vital Intelligence for System Integrity, Observation & Nostics

Downloads the official NASA C-MAPSS turbofan engine degradation dataset,
extracts all 12 core files into `data/raw/`, and validates file completeness.
"""

from __future__ import annotations

import io
import os
import shutil
import sys
import urllib.request
import zipfile
from pathlib import Path

# Primary and backup URLs
PRIMARY_URL = "https://data.nasa.gov/docs/legacy/CMAPSSData.zip"
BACKUP_URL = "https://phm-datasets.s3.amazonaws.com/NASA/6.+Turbofan+Engine+Degradation+Simulation+Data+Set.zip"

CORE_FILES = [
    "train_FD001.txt", "train_FD002.txt", "train_FD003.txt", "train_FD004.txt",
    "test_FD001.txt", "test_FD002.txt", "test_FD003.txt", "test_FD004.txt",
    "RUL_FD001.txt", "RUL_FD002.txt", "RUL_FD003.txt", "RUL_FD004.txt",
]


def check_existing_files(dest_dir: Path) -> bool:
    """Check if all 12 core C-MAPSS text files exist and are non-empty."""
    for filename in CORE_FILES:
        target = dest_dir / filename
        if not target.exists() or target.stat().st_size == 0:
            return False
    return True


def try_local_search_and_copy(dest_dir: Path) -> bool:
    """Search alternate local paths for C-MAPSS files if offline."""
    search_paths = [
        Path("output/cmapss"),
        Path("C:/Users/anves/Downloads/VISION/output/cmapss"),
        Path("../output/cmapss"),
        Path("cmapss"),
    ]
    for sp in search_paths:
        if sp.exists() and sp.is_dir():
            matched = 0
            for filename in CORE_FILES:
                src = sp / filename
                if src.exists() and src.stat().st_size > 0:
                    matched += 1
            if matched == len(CORE_FILES):
                print(f"[INFO] Found all 12 C-MAPSS files in local path: {sp}")
                for filename in CORE_FILES:
                    shutil.copy2(sp / filename, dest_dir / filename)
                return True
    return False


def download_zip(url: str, timeout: int = 45) -> bytes:
    """Download ZIP archive with standard browser User-Agent headers."""
    print(f"[INFO] Connecting to dataset source: {url}")
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) VISION-PHM-Pipeline"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as response:
        content_length = response.headers.get("Content-Length")
        total_size = int(content_length) if content_length else None
        
        data = bytearray()
        chunk_size = 128 * 1024
        downloaded = 0
        
        while True:
            chunk = response.read(chunk_size)
            if not chunk:
                break
            data.extend(chunk)
            downloaded += len(chunk)
            if total_size:
                pct = (downloaded / total_size) * 100
                sys.stdout.write(f"\r[INFO] Downloading: {downloaded / (1024 * 1024):.2f} MB / {total_size / (1024 * 1024):.2f} MB ({pct:.1f}%)")
            else:
                sys.stdout.write(f"\r[INFO] Downloading: {downloaded / (1024 * 1024):.2f} MB")
            sys.stdout.flush()
        sys.stdout.write("\n")
        return bytes(data)


def extract_cmapss_zip(zip_bytes: bytes, dest_dir: Path) -> None:
    """Extract all 12 core files from zip, handling nested directory structures."""
    dest_dir.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        file_map = {Path(name).name.lower(): name for name in zf.namelist()}
        
        for required in CORE_FILES:
            req_lower = required.lower()
            if req_lower in file_map:
                zip_member = file_map[req_lower]
                out_path = dest_dir / required
                with zf.open(zip_member) as src, open(out_path, "wb") as dst:
                    shutil.copyfileobj(src, dst)
            else:
                # Check for possible alternative case or prefix match
                found = False
                for name in zf.namelist():
                    if Path(name).name.lower() == req_lower:
                        with zf.open(name) as src, open(dest_dir / required, "wb") as dst:
                            shutil.copyfileobj(src, dst)
                        found = True
                        break
                if not found:
                    raise FileNotFoundError(f"Required dataset file '{required}' not found in archive.")


def print_summary_table(dest_dir: Path) -> None:
    """Print a clean summary table of file sizes and line counts."""
    print("\n" + "=" * 65)
    print(f"{'Filename':<22} | {'Size (KB)':<12} | {'Line Count':<12} | {'Status'}")
    print("-" * 65)
    
    for filename in sorted(CORE_FILES):
        p = dest_dir / filename
        if p.exists():
            size_kb = p.stat().st_size / 1024.0
            with open(p, "rb") as f:
                lines = sum(1 for _ in f)
            print(f"{filename:<22} | {size_kb:>10.1f} KB | {lines:>10}   | OK")
        else:
            print(f"{filename:<22} | {'MISSING':>12} | {'-':>10}   | FAIL")
    print("=" * 65 + "\n")


def main() -> int:
    # Resolve repository root
    script_dir = Path(__file__).resolve().parent
    repo_root = script_dir.parent
    dest_dir = repo_root / "data" / "raw"
    dest_dir.mkdir(parents=True, exist_ok=True)

    print("========================================================")
    print("VISION: NASA C-MAPSS Dataset Ingestion Protocol")
    print("========================================================")
    print(f"Target directory: {dest_dir.resolve()}")

    # 1. Check if files already present
    if check_existing_files(dest_dir):
        print("[INFO] All 12 C-MAPSS files already exist and are verified in data/raw/.")
        print_summary_table(dest_dir)
        return 0

    # 2. Check local fallback directories
    if try_local_search_and_copy(dest_dir):
        if check_existing_files(dest_dir):
            print("[INFO] Successfully imported dataset from local storage.")
            print_summary_table(dest_dir)
            return 0

    # 3. Attempt download from primary source
    zip_bytes = None
    try:
        zip_bytes = download_zip(PRIMARY_URL)
    except Exception as e:
        print(f"[WARNING] Primary source download failed: {e}")
        print("[INFO] Attempting download from backup mirror...")
        try:
            zip_bytes = download_zip(BACKUP_URL)
        except Exception as e2:
            print(f"[ERROR] Backup source download failed: {e2}")
            print("\n[RECOVERY PROTOCOL]:")
            print("Please manually place the 12 C-MAPSS text files into: " + str(dest_dir.resolve()))
            return 1

    # 4. Extract and verify
    print("[INFO] Extracting dataset archives into data/raw/...")
    extract_cmapss_zip(zip_bytes, dest_dir)

    # 5. Final integrity check and summary
    if not check_existing_files(dest_dir):
        print("[ERROR] Verification failed: One or more files are missing after extraction.")
        return 1

    print("[SUCCESS] All 12 NASA C-MAPSS dataset files verified successfully.")
    print_summary_table(dest_dir)
    return 0


if __name__ == "__main__":
    sys.exit(main())

