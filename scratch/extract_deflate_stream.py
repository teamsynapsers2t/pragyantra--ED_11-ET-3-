import os
import zlib
import struct

zip_path = r"c:\Users\tumra\Documents\paper-AI\paper-ai.zip"
target_file_bytes = b"app/dashboard/page.tsx"
out_dir = r"c:\Users\tumra\Documents\paper-AI\paper-ai\scratch"

if not os.path.exists(zip_path):
    print("Zip file does not exist.")
    exit(1)

with open(zip_path, 'rb') as f:
    print("Reading zip file into memory...")
    data = f.read()
    
    offset = 0
    match_count = 0
    while True:
        pos = data.find(target_file_bytes, offset)
        if pos == -1:
            break
        
        print(f"\nFound occurrence of filename at offset {pos}")
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
        name_len = struct.unpack("<H", data[sig_pos+26 : sig_pos+28])[0]
        extra_len = struct.unpack("<H", data[sig_pos+28 : sig_pos+30])[0]
        
        print(f"  Compression Method: {comp_method}")
        print(f"  Filename Length: {name_len} bytes")
        print(f"  Extra Field Length: {extra_len} bytes")
        
        data_start = sig_pos + 30 + name_len + extra_len
        print(f"  Data starts at: {data_start}")
        
        if comp_method == 8:
            # Deflated
            try:
                # Use decompressobj to stream-decompress and stop at eof
                decompressor = zlib.decompressobj(-15)
                # Feed the rest of the zip file data starting from data_start
                decompressed_bytes = decompressor.decompress(data[data_start:])
                
                print(f"  SUCCESS! Decompressed size: {len(decompressed_bytes)} bytes")
                print(f"  Compressed bytes consumed: {len(data[data_start:]) - len(decompressor.unused_data)} bytes")
                
                out_file = os.path.join(out_dir, f"recovered_dashboard_{match_count}.tsx")
                with open(out_file, 'wb') as out_f:
                    out_f.write(decompressed_bytes)
                print(f"  Saved to {out_file}")
                
                # Decode and print first 10 lines
                text = decompressed_bytes.decode('utf-8', errors='replace')
                lines = text.splitlines()
                print("  Snippet of recovered file:")
                for l in lines[:15]:
                    print("    ", l)
                match_count += 1
            except Exception as e:
                print(f"  Decompression failed: {e}")
        else:
            print(f"  Unsupported or uncompressed method: {comp_method}")
            
        offset = pos + len(target_file_bytes)

print(f"\nExtraction complete. Recovered {match_count} versions.")
