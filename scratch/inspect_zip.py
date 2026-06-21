import zipfile

zip_path = r"c:\Users\tumra\Documents\paper-AI\paper-ai.zip"

try:
    print(f"Opening zip file: {zip_path}...")
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        print("Listing first 100 files in the zip:")
        namelist = zip_ref.namelist()
        print(f"Total files: {len(namelist)}")
        sql_files = [name for name in namelist if name.endswith('.sql')]
        env_files = [name for name in namelist if '.env' in name]
        
        print("\n--- SQL Files found in Zip ---")
        for f in sql_files:
            print(f)
            
        print("\n--- Env Files found in Zip ---")
        for f in env_files:
            print(f)
            
        print("\n--- First 30 files ---")
        for name in namelist[:30]:
            print(name)
except Exception as e:
    print("Error opening zip file:", e)
