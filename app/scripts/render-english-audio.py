"""Development-only Piper synthesis; the Android app plays bundled AAC files."""
import hashlib
import json
import subprocess
import sys
import wave
from pathlib import Path
import onnxruntime
from piper import PiperVoice, SynthesisConfig
from piper.config import PiperConfig
from piper.voice import ESPEAK_DATA_DIR

model, task_file, output_dir, temporary_dir = map(Path, sys.argv[1:])
expected = {
    model: '5d4f08ba6a2a48c44592eed3ce56bf85e9de3dd4e20df90541ae68a8310c029a',
    Path(str(model) + '.json'): '7e1f4634af596d83cca997fb7a931ba80b70f8a316a2655ee69c55365e0ace14',
}
for path, digest in expected.items():
    if hashlib.sha256(path.read_bytes()).hexdigest() != digest:
        raise ValueError(f'Voice checksum mismatch: {path}')
options = onnxruntime.SessionOptions()
options.intra_op_num_threads = 2
options.inter_op_num_threads = 1
voice = PiperVoice(
    config=PiperConfig.from_dict(json.loads(Path(str(model) + '.json').read_text())),
    session=onnxruntime.InferenceSession(str(model), sess_options=options, providers=['CPUExecutionProvider']),
    espeak_data_dir=ESPEAK_DATA_DIR,
    download_dir=temporary_dir,
)
config = SynthesisConfig(length_scale=1.1)
tasks = json.loads(task_file.read_text())
for count, (name, text) in enumerate(tasks, 1):
    target = output_dir / f'{name}.m4a'
    if not target.exists():
        wav_path = temporary_dir / f'{name}.wav'
        with wave.open(str(wav_path), 'wb') as wav_file:
            voice.synthesize_wav(text, wav_file, syn_config=config)
        encoded = temporary_dir / f'{name}.m4a'
        subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-i', str(wav_path), '-ac', '1', '-c:a', 'aac', '-b:a', '48k', '-movflags', '+faststart', str(encoded)], check=True)
        encoded.replace(target)
        wav_path.unlink()
    if count % 24 == 0 or count == len(tasks):
        print(f'Audio {count}/{len(tasks)}', flush=True)
