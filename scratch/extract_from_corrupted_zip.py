import os
import zlib
import struct

zip_path = r"c:\Users\tumra\Documents\paper-AI\paper-ai.zip"
target_file_bytes = b"app/dashboard/page.tsx"
out_dir = r"c:\Users\tumra\Documents\paper-AI\paper-ai\scratch"

if not os.path.exists(zip_path):
    print("Zip file does not exist.")
    exit(1)

print(f"Scanning {zip_path} for filename {target_file_bytes}...")
file_size = os.path.getsize(zip_path)

with open(zip_path, 'rb') as f:
    print("Reading zip file into memory...")
    data = f.read()
    print("Search starting...")
    
    offset = 0
    match_count = 0
    while True:
        pos = data.find(target_file_bytes, offset)
        if pos == -1:
            break
        
        print(f"Found occurrence of filename at offset {pos}")
        # Find the PK\x03\x04 signature before this filename
        # We search up to 100 bytes back
        sig_pos = -1
        for i in range(max(0, pos - 100), pos):
            if data[i:i+4] == b"PK\x03\x04":
                sig_pos = i
                break
        
        if sig_pos == -1:
            print("  Could not find PK\\x03\\x04 signature before filename.")
            offset = pos + len(target_file_bytes)
            continue
        
        print(f"  Found PK\\x03\\x04 signature at offset {sig_pos}")
        
        comp_method = struct.unpack("<H", data[sig_pos+8 : sig_pos+10])[0]
        comp_size = struct.unpack("<I", data[sig_pos+18 : sig_pos+22])[0]
        uncomp_size = struct.unpack("<I", data[sig_pos+22 : sig_pos+26])[0]
        name_len = struct.unpack("<H", data[sig_pos+26 : sig_pos+28])[0]
        extra_len = struct.unpack("<H", data[sig_pos+28 : sig_pos+30])[0]
        
        print(f"  Compression Method: {comp_method}")
        print(f"  Compressed Size: {comp_size} bytes")
        print(f"  Uncompressed Size: {uncomp_size} bytes")
        print(f"  Filename Length: {name_len} bytes")
        print(f"  Extra Field Length: {extra_len} bytes")
        
        data_start = sig_pos + 30 + name_len + extra_len
        data_end = data_start + comp_size
        
        print(f"  Data start: {data_start}, data end: {data_end}")
        
        compressed_bytes = data[data_start:data_end]
        
        # Try to decompress
        try:
            if comp_method == 0:
                decompressed_bytes = compressed_bytes
            elif comp_method == 8:
                decompressed_bytes = zlib.decompress(compressed_bytes, -15)
            else:
                print(f"  Unsupported compression method {comp_method}")
                offset = pos + len(target_file_bytes)
                continue
                
            out_file = os.path.join(out_dir, f"extracted_zip_match_{match_count}.tsx")
            with open(out_file, 'wb') as out_f:
                out_f.write(decompressed_bytes)
            print(f"  SUCCESSFULLY extracted match to {out_file} (size: {len(decompressed_bytes)} bytes)")
            match_count += 1
            
            try:
                text = decompressed_bytes.decode('utf-8')
                print("  File starts with:")
                print("\n".join(["    " + line for line in text.splitlines()[:5]]))
            except Exception as e:
                print("  Failed to decode as UTF-8:", e)
                
        except Exception as e:
            print(f"  Decompression failed: {e}")
            
        offset = pos + len(target_file_bytes)

print(f"Scan complete. Extracted {match_count} versions.")
