import os
import re

simulations_folder = "simulations"
files_to_rename = []

if os.path.exists(simulations_folder):
    for filename in os.listdir(simulations_folder):
        # Regex to match genN_descriptor.html where N is a single digit 1-9
        # and descriptor does not start with an underscore (to avoid genN_desc_1.html)
        if re.match(r"gen([1-9])_[^_][^\/]*\.html$", filename):
            files_to_rename.append(filename)
            print(filename) # Output the file to be renamed
else:
    print(f"Error: Folder '{simulations_folder}' not found.")

# This script will print the filenames that match the criteria.
# The calling agent can then use this list.
