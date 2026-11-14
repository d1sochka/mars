"""
MARS Music Aggregator - Yandex Music API Bridge
Based on Ilya (MarshalX) yandex-music-api (https://github.com/MarshalX/yandex-music-api)
"""

import os
import sys
import json
from yandex_music import Client

def main():
    token = os.environ.get('YANDEX_MUSIC_TOKEN', None)
    if len(sys.argv) > 1 and sys.argv[1].startswith('y0_'):
        token = sys.argv[1]

    client = Client(token).init()
    print(f"[*] YAM Client initialized. Authorized: {bool(token)}")

    # Test search
    query = sys.argv[2] if len(sys.argv) > 2 else "Brambles Charcoal"
    search_result = client.search(query, type_='track')
    
    if search_result.tracks and search_result.tracks.results:
        track = search_result.tracks.results[0]
        print(f"[+] Found track: {track.title} by {', '.join(a.name for a in track.artists)}")
        
        info = track.get_download_info(get_direct_links=True)
        if info:
            best = max(info, key=lambda x: x.bitrate_in_kbps)
            print(f"[+] Bitrate: {best.bitrate_in_kbps} kbps (Codec: {best.codec})")
            print(f"[+] Direct MP3 Stream URL: {best.direct_link}")
    else:
        print("[-] No tracks found")

if __name__ == '__main__':
    main()
