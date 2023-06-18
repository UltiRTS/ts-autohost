import hashlib
import os
import platform
import subprocess 
import shutil
RESOURCE_URL = "https://ultirts.blob.core.windows.net/engine-resource/resources.tar.gz"
RESOURCE_HASH = "7c695fd3de36b4cfa8fea22305d4c19ad492eece2414015c0390075e389c5708"

PLATFORM = "windows" if platform.system() == "Windows" else "linux"
ENGINE_URL = "https://github.com/beyond-all-reason/spring/releases/download/spring_bar_%7BBAR105%7D105.1.1-1806-g5f78600/spring_bar_.BAR105.105.1.1-1806-g5f78600_{}-64-minimal-portable.7z".format(PLATFORM)


def execute_cmd(cmd: str, err_msg: str): 
    print(f"+{cmd}")
    retcode = os.system(cmd)
    if retcode != 0:
        raise RuntimeError(err_msg)
    
def file_sha256_checksum(path, hash_str):
    sha256 = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            sha256.update(chunk)
    return sha256.hexdigest() == hash_str
    
if __name__ == "__main__":
    proc = subprocess.Popen("7z", stderr=subprocess.DEVNULL, stdout=subprocess.DEVNULL)
    retcode = proc.wait()
    if retcode != 0:
        raise RuntimeError("7z is not installed")

    download_engine_cmd = "curl -L -o engine.7z {}".format(ENGINE_URL)
    execute_cmd(download_engine_cmd, "Failed to download engine")
    
    unzip_engine_cmd = "7z x engine.7z -oengine"
    execute_cmd(unzip_engine_cmd, "Failed to unzip engine")
  
    download_resource_cmd = "wget -O resources.tar.gz {}".format(RESOURCE_URL) 
    execute_cmd(download_resource_cmd, "Failed to download resources")
    
    resource_hash = hashlib.sha256(open("resources.tar.gz", "rb").read()).hexdigest()
    if not file_sha256_checksum("resources.tar.gz", RESOURCE_HASH):
        raise RuntimeError("Resource hash mismatch")
    
    unpack_resource_cmd = "tar -xzf resources.tar.gz -C engine"
    execute_cmd(unpack_resource_cmd, "Failed to unpack resources")
    os.remove("resources.tar.gz")
    os.remove("engine.7z")