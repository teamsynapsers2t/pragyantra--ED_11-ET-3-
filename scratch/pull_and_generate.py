import os
import subprocess

def load_env():
    env = {}
    for path in [".env", ".env.local"]:
        if os.path.exists(path):
            with open(path, "r") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#"):
                        parts = line.split("=", 1)
                        if len(parts) == 2:
                            key = parts[0].strip()
                            val = parts[1].strip().strip('"').strip("'")
                            env[key] = val
    return env

env_vars = load_env()
db_url = env_vars.get("DATABASE_URL")
if not db_url:
    print("DATABASE_URL not found")
    exit(1)

# Set the environment variable for the child process
custom_env = os.environ.copy()
custom_env["DATABASE_URL"] = db_url

print("Running prisma db pull...")
pull_res = subprocess.run(
    ["npx", "prisma", "db", "pull", "--schema=../prisma/schema.prisma"],
    shell=True,
    env=custom_env,
    cwd="."
)
print("db pull exit code:", pull_res.returncode)

if pull_res.returncode == 0:
    print("\nRunning prisma generate...")
    gen_res = subprocess.run(
        ["npx", "prisma", "generate", "--schema=../prisma/schema.prisma"],
        shell=True,
        env=custom_env,
        cwd="."
    )
    print("generate exit code:", gen_res.returncode)
