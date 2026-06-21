import subprocess
import re

print("=== Running netstat -ano ===")
try:
    output = subprocess.check_output("netstat -ano", shell=True).decode('utf-8')
    lines = output.split('\n')
    
    # We are interested in listening ports and connections on localhost (127.0.0.1 or [::1])
    # especially around 50000-60000 range.
    print("Local TCP ports listening or connected:")
    for line in lines:
        if "TCP" in line:
            parts = line.split()
            if len(parts) >= 4:
                proto, local, foreign, state = parts[:4]
                # Filter for local port in range 50000-60000 or postgres
                match = re.search(r':(\d+)$', local)
                if match:
                    port = int(match.group(1))
                    if 50000 <= port <= 60000 or port == 5432:
                        print(line.strip())
except Exception as e:
    print("Error running netstat:", e)
