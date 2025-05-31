import os
import re

simulations_folder = "simulations"
rename_map = {}

if os.path.exists(simulations_folder):
    for filename in os.listdir(simulations_folder):
        match = re.match(r"gen([1-9])_([^_][^\/]*\.html)$", filename)
        if match:
            digit = match.group(1)
            descriptor_part = match.group(2) # This includes .html at the end

            new_filename = f"gen0{digit}_{descriptor_part}"
            rename_map[filename] = new_filename
            print(f"{filename} {new_filename}") # Output old and new name
else:
    print(f"Error: Folder '{simulations_folder}' not found.")

# This script will print the old and new filenames for mapping.
