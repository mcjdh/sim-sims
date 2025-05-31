import os
import re

source_folders = ["gen7", "gen8", "gen9", "gen10"]
output_folder = "simulations"
file_map = {}
new_names_by_gen = {}

for folder in source_folders:
    for root, dirs, files in os.walk(folder):
        for filename in files:
            if filename.endswith(".html"):
                original_path = os.path.join(root, filename)

                # Extract generation number
                match = re.search(r'gen(\d+)', root)
                if not match:
                    # Try to get from folder name if not in root path (e.g. gen9/t/)
                    match = re.search(r'gen(\d+)', folder)
                if not match:
                    print(f"Warning: Could not determine generation for {original_path}")
                    continue
                gen_number = match.group(1)

                base_name = filename[:-5] # Remove .html
                descriptor = base_name.replace('-', '_')
                descriptor = descriptor[:5]

                new_filename_base = f"gen{gen_number}_{descriptor}"
                new_filename = f"{new_filename_base}.html"

                # Initialize set for this generation if not present
                if gen_number not in new_names_by_gen:
                    new_names_by_gen[gen_number] = set()

                # Handle conflicts for descriptor within the same generation batch
                counter = 1
                final_new_filename = new_filename
                while final_new_filename in new_names_by_gen[gen_number]:
                    final_new_filename = f"{new_filename_base}_{counter}.html"
                    counter += 1

                new_names_by_gen[gen_number].add(final_new_filename)
                file_map[original_path] = os.path.join(output_folder, final_new_filename)

for old, new in file_map.items():
    print(f"{old} {new}")
