import os

zip_path = r"c:\Users\tumra\Documents\paper-AI\paper-ai.zip"

with open(zip_path, 'rb') as f:
    f.seek(max(0, 996522651 - 100))
    data = f.read(150)
    print("Hex around offset (996522651):")
    print(data.hex())
    print("\nASCII representation:")
    print(''.join(chr(b) if 32 <= b < 127 else '.' for b in data))
