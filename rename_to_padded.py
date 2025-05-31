import os
import re

simulations_folder = "simulations"
renamed_files_count = 0

if not os.path.exists(simulations_folder):
    print(f"Error: Folder '{simulations_folder}' not found.")
else:
    print(f"Processing files in '{simulations_folder}'...")
    for filename in os.listdir(simulations_folder):
        match = re.match(r"gen([1-9])_([^_][^\/]*\.html)$", filename)
        if match:
            digit = match.group(1)
            descriptor_part = match.group(2) # This includes .html

            new_filename = f"gen0{digit}_{descriptor_part}"

            old_full_path = os.path.join(simulations_folder, filename)
            new_full_path = os.path.join(simulations_folder, new_filename)

            if old_full_path == new_full_path: # Should not happen with this logic
                print(f"Skipping {filename} as new name is identical (should not occur).")
                continue

            if os.path.exists(new_full_path):
                print(f"Warning: Target file {new_full_path} already exists. Skipping rename of {filename}.")
            else:
                try:
                    os.rename(old_full_path, new_full_path)
                    print(f"Renamed: {old_full_path} -> {new_full_path}")
                    renamed_files_count += 1
                except OSError as e:
                    print(f"Error renaming {old_full_path} to {new_full_path}: {e}")

    print(f"Renaming process complete. {renamed_files_count} files were renamed.")
