import os
import shutil
import subprocess

# Paths
root_dir = r"c:\Users\tumra\Documents\paper-AI"
paper_ai_dir = os.path.join(root_dir, "paper-ai")
env_source = os.path.join(paper_ai_dir, ".env")
env_dest = os.path.join(root_dir, ".env")

print(f"Copying {env_source} to {env_dest}...")
shutil.copy(env_source, env_dest)

print("Running prisma db pull in root...")
pull_res = subprocess.run(
    ["npx", "prisma", "db", "pull"],
    shell=True,
    cwd=root_dir
)
print("db pull exit code:", pull_res.returncode)

if pull_res.returncode == 0:
    print("Running prisma generate in root...")
    gen_res = subprocess.run(
        ["npx", "prisma", "generate"],
        shell=True,
        cwd=root_dir
    )
    print("generate exit code:", gen_res.returncode)
