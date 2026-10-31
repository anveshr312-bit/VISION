import os
import sys

from prompts_part1 import get_part1
from prompts_part2 import get_part2
from prompts_part3 import get_part3
from prompts_part4 import get_part4

OUT_PATH = r"C:\Users\anves\Downloads\VISION\VISION_PHM_ANTIGRAVITY_PROMPTS.txt"

def main():
    print("Assembling VISION_PHM_ANTIGRAVITY_PROMPTS.txt...")
    part1 = get_part1()
    part2 = get_part2()
    part3 = get_part3()
    part4 = get_part4()
    
    full_content = part1 + part2 + part3 + part4
    
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        f.write(full_content)
    
    print(f"File successfully written to: {OUT_PATH}")
    print(f"Total characters: {len(full_content)}")
    print(f"Total lines: {full_content.count(chr(10)) + 1}")

if __name__ == "__main__":
    main()

