# Update project name and acronym across VISION_PHM_ANTIGRAVITY_PROMPTS.txt and scratch files
import os

target_file = r"C:\Users\anves\Downloads\VISION\VISION_PHM_ANTIGRAVITY_PROMPTS.txt"

with open(target_file, "r", encoding="utf-8") as f:
    content = f.read()

replacements = [
    (
        "VISION-PHM: COMPLETE ANTIGRAVITY IDE SEQUENTIAL PROMPT PACK",
        "VISION: COMPLETE ANTIGRAVITY IDE SEQUENTIAL PROMPT PACK\nVital Intelligence for System Integrity, Observation & Nostics"
    ),
    (
        "# VISION-PHM Configuration",
        "# VISION: Vital Intelligence for System Integrity, Observation & Nostics\n# Configuration"
    ),
    (
        "- Project Name: VISION-PHM (Intelligent Prognostics & Health Management Platform)",
        "- Project Name: VISION (Vital Intelligence for System Integrity, Observation & Nostics)"
    ),
    (
        '"VISION-PHM | Aero-Engine Digital Twin & Decision Engine"',
        '"VISION | Vital Intelligence for System Integrity, Observation & Nostics"'
    ),
    (
        "Policy 3: VISION-PHM Risk-Controlled Conformal Trigger",
        "Policy 3: VISION Risk-Controlled Conformal Trigger"
    ),
    (
        "Fixed vs 7.8 cycles for VISION-PHM",
        "Fixed vs 7.8 cycles for VISION"
    ),
    (
        "how VISION-PHM's masked modality architecture",
        "how VISION's masked modality architecture"
    ),
    (
        "VISION-PHM delivers provably safe maintenance decisions",
        "VISION delivers provably safe maintenance decisions"
    ),
    (
        "To build, run, and test VISION-PHM locally",
        "To build, run, and test VISION locally"
    )
]

for old, new in replacements:
    assert old in content, f"Target string not found: {old}"
    content = content.replace(old, new)

with open(target_file, "w", encoding="utf-8") as f:
    f.write(content)

print("VISION_PHM_ANTIGRAVITY_PROMPTS.txt updated successfully.")

# Also update the scratch parts for consistency
for part_file in ["prompts_part1.py", "prompts_part3.py", "prompts_part4.py"]:
    part_path = os.path.join(r"C:\Users\anves\Downloads\VISION\scratch", part_file)
    if os.path.exists(part_path):
        with open(part_path, "r", encoding="utf-8") as f:
            p_content = f.read()
        for old, new in replacements:
            p_content = p_content.replace(old, new)
        with open(part_path, "w", encoding="utf-8") as f:
            f.write(p_content)
        print(f"Updated {part_file}")

