import zipfile
import os

zip_path = "c:\\Users\\tumra\\Documents\\paper-AI\\paper-ai.zip"
target_file = "paper-ai/app/dashboard/page.tsx"
out_path = "c:\\Users\\tumra\\Documents\\paper-AI\\paper-ai\\scratch\\restored_dashboard_page.tsx"

if not os.path.exists(zip_path):
    print("Zip file does not exist.")
    exit(1)

print("Opening zip file...")
with zipfile.ZipFile(zip_path, 'r') as zip_ref:
    # List all files matching the target
    namelist = zip_ref.namelist()
    matches = [name for name in namelist if name.endswith("app/dashboard/page.tsx")]
    print("Found matches in zip:", matches)
    
    if matches:
        print(f"Extracting {matches[0]} to {out_path}...")
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        with open(out_path, 'wb') as f_out:
            f_out.write(zip_ref.read(matches[0]))
        print("Extraction complete!")
    else:
        print("No matching file found in zip.")
