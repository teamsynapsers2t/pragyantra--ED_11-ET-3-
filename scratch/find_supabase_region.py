import psycopg2

regions = [
    "ap-south-1", "us-east-1", "us-east-2", "us-west-1", "us-west-2",
    "eu-west-1", "eu-west-2", "eu-west-3", "eu-central-1",
    "ap-southeast-1", "ap-southeast-2", "ap-northeast-1", "ap-northeast-2",
    "ca-central-1", "sa-east-1"
]

user = "postgres.pdnpfpjtbpmuvzopvren"
password = "Tanishq@1234" # or any string to trigger auth check

for region in regions:
    host = f"aws-0-{region}.pooler.supabase.com"
    try:
        # Just try to open socket/connection
        conn = psycopg2.connect(
            host=host,
            database="postgres",
            user=user,
            password=password,
            port=6543,
            connect_timeout=2
        )
        print(f"SUCCESS! Connected to {region} pooler!")
        conn.close()
        break
    except Exception as e:
        err_msg = str(e).strip()
        if "password authentication failed" in err_msg:
            print(f"FOUND REGION: {region} (auth failed, but tenant exists)")
            break
        elif "tenant/user" in err_msg and "not found" in err_msg:
            # Tenant not found in this region
            pass
        else:
            print(f"Region {region} other error: {err_msg}")
