import os
import re
import shutil

source_folders = ["gen7", "gen8", "gen9", "gen10"]
output_folder = "simulations"
os.makedirs(output_folder, exist_ok=True)

# To keep track of names used in this batch for each generation,
# before checking against existing files in simulations folder
batch_new_names_by_gen = {}

# To keep track of final names to be used, after checking existing files
final_file_map = {}

print("Starting file processing...")

for folder in source_folders:
    for root, dirs, files in os.walk(folder):
        for filename in files:
            if filename.endswith(".html"):
                original_path = os.path.join(root, filename)

                match_gen_root = re.search(r'gen(\d+)', root)
                match_gen_folder = re.search(r'gen(\d+)', folder)

                if match_gen_root:
                    gen_number = match_gen_root.group(1)
                elif match_gen_folder: # For subdirs like gen9/t
                    gen_number = match_gen_folder.group(1)
                else:
                    print(f"Warning: Could not determine generation for {original_path}. Skipping.")
                    continue

                base_name = filename[:-5] # Remove .html
                descriptor = base_name.replace('-', '_')
                descriptor_base = descriptor[:5]

                # Initialize set for this generation's batch names if not present
                if gen_number not in batch_new_names_by_gen:
                    batch_new_names_by_gen[gen_number] = set()

                # Handle conflicts for descriptor within the same generation batch (Step 3.c.ii)
                temp_new_filename_base = f"gen{gen_number}_{descriptor_base}"
                temp_new_filename = f"{temp_new_filename_base}.html"
                counter = 1
                while temp_new_filename in batch_new_names_by_gen[gen_number]:
                    temp_new_filename = f"{temp_new_filename_base}_{counter}.html"
                    counter += 1
                batch_new_names_by_gen[gen_number].add(temp_new_filename)

                # Now, check this batch-unique name against existing files in simulations (Step 3.c.iii)
                final_new_filename_candidate = temp_new_filename
                # final_descriptor_part_for_sim_check = os.path.splitext(temp_new_filename)[0] # e.g. gen7_cosmi or gen7_cosmi_1

                sim_counter = 0 # Start with 0 to check the name itself first, then _1, _2 ...
                                # This counter is for suffixes due to *simulation folder* conflicts.

                # Refined base for adding simulation conflict suffixes
                # if gen7_cosmi_1.html came from batch, base for sim check is gen7_cosmi_1
                # if gen7_cosmi.html came from batch, base for sim check is gen7_cosmi
                base_for_sim_suffixing = os.path.splitext(final_new_filename_candidate)[0]
                current_target_path_check = os.path.join(output_folder, final_new_filename_candidate)

                # This loop handles conflicts with files *already in the simulations folder*
                while os.path.exists(current_target_path_check):
                    sim_counter += 1 # Start suffixing with _1, _2, ...
                    # The base for suffixing should be the original descriptor from the batch,
                    # e.g., if batch produced genX_desc_Y, next is genX_desc_Y_1 (sim conflict)
                    # not genX_desc_Y_1_1
                    final_new_filename_candidate = f"{base_for_sim_suffixing}_{sim_counter}.html"
                    current_target_path_check = os.path.join(output_folder, final_new_filename_candidate)

                final_target_path = current_target_path_check # This is the unique name for simulations folder
                final_file_map[original_path] = final_target_path

# Execute moves
for original_path, final_target_path in final_file_map.items():
    try:
        shutil.move(original_path, final_target_path)
        print(f"Moved: {original_path} -> {final_target_path}")
    except Exception as e:
        print(f"Error moving {original_path} to {final_target_path}: {e}")

print("File moving and renaming process complete.")
