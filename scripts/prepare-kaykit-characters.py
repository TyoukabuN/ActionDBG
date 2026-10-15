"""Keep selected animation clips and their binary dependencies in KayKit GLBs.

Usage: python3 scripts/prepare-kaykit-characters.py /path/to/upstream-checkout
The upstream revision and redistribution license are recorded beside the outputs.
"""
import hashlib
import json
from pathlib import Path
import struct
import sys

CLIPS = {
    'Idle', '1H_Melee_Attack_Chop', '1H_Melee_Attack_Slice_Horizontal',
    '1H_Melee_Attack_Stab', 'Block', 'Blocking', 'Block_Hit', 'Block_Attack',
    'Hit_A', 'Death_A', 'Death_A_Pose', 'Cheer',
}
SOURCE_HASHES = {
    'Knight.glb': '60428e3abc09ba83e595d256e3af8c5c976b46cdae599f0802fc82b4a3445168',
    'Barbarian.glb': 'cefc311a0e10c7858b6141f5ada7e33268727564fb8ac1347aab97d000669cc6',
}


def prepare(source: Path, destination: Path) -> dict:
    original = source.read_bytes()
    if hashlib.sha256(original).hexdigest() != SOURCE_HASHES[source.name]:
        raise ValueError('Source differs from the recorded upstream revision')
    magic, version, length = struct.unpack_from('<4sII', original)
    if (magic, version, length) != (b'glTF', 2, len(original)):
        raise ValueError('Expected a complete GLB 2 file')
    json_length, json_type = struct.unpack_from('<I4s', original, 12)
    if json_type != b'JSON':
        raise ValueError('Expected JSON chunk')
    document = json.loads(original[20:20 + json_length])
    binary_offset = 20 + json_length
    binary_length, binary_type = struct.unpack_from('<I4s', original, binary_offset)
    if binary_type != b'BIN\0' or len(document['buffers']) != 1:
        raise ValueError('Expected a single embedded buffer')
    binary = original[binary_offset + 8:binary_offset + 8 + binary_length]
    if document.get('extensionsUsed'):
        raise ValueError('Review buffer references in extensions before processing')
    original_count = len(document['animations'])
    document['animations'] = [a for a in document['animations'] if a['name'] in CLIPS]
    if {a['name'] for a in document['animations']} != CLIPS:
        raise ValueError('Missing required animation')

    # Mutable references to accessor indices, from the glTF core specification.
    references = []
    for mesh in document['meshes']:
        for primitive in mesh['primitives']:
            references.extend((primitive['attributes'], k) for k in primitive['attributes'])
            if 'indices' in primitive:
                references.append((primitive, 'indices'))
            for target in primitive.get('targets', []):
                references.extend((target, k) for k in target)
    for skin in document.get('skins', []):
        if 'inverseBindMatrices' in skin:
            references.append((skin, 'inverseBindMatrices'))
    for animation in document['animations']:
        for sampler in animation['samplers']:
            references.extend([(sampler, 'input'), (sampler, 'output')])
    indices = sorted({container[key] for container, key in references})
    accessor_map = {old: new for new, old in enumerate(indices)}
    document['accessors'] = [document['accessors'][i] for i in indices]
    for container, key in references:
        container[key] = accessor_map[container[key]]

    view_references = []
    for accessor in document['accessors']:
        if 'bufferView' in accessor:
            view_references.append((accessor, 'bufferView'))
        if 'sparse' in accessor:
            view_references.extend((accessor['sparse'][k], 'bufferView') for k in ['indices', 'values'])
    for image in document.get('images', []):
        if 'uri' in image:
            raise ValueError('Expected embedded textures')
        view_references.append((image, 'bufferView'))
    view_indices = sorted({container[key] for container, key in view_references})
    view_map = {old: new for new, old in enumerate(view_indices)}
    packed = bytearray()
    views = []
    for i in view_indices:
        view = dict(document['bufferViews'][i])
        start, size = view.get('byteOffset', 0), view['byteLength']
        if view['buffer'] != 0 or start + size > len(binary):
            raise ValueError('Invalid source buffer view')
        packed.extend(b'\0' * (-len(packed) % 4))
        view['byteOffset'] = len(packed)
        packed.extend(binary[start:start + size])
        views.append(view)
    document['bufferViews'] = views
    for container, key in view_references:
        container[key] = view_map[container[key]]
    document['buffers'] = [{'byteLength': len(packed)}]
    encoded = json.dumps(document, separators=(',', ':')).encode()
    encoded += b' ' * (-len(encoded) % 4)
    packed.extend(b'\0' * (-len(packed) % 4))
    result = (struct.pack('<4sII', b'glTF', 2, 28 + len(encoded) + len(packed))
              + struct.pack('<I4s', len(encoded), b'JSON') + encoded
              + struct.pack('<I4s', len(packed), b'BIN\0') + packed)
    destination.write_bytes(result)
    return {
        'source': source.name, 'sourceBytes': len(original), 'bytes': len(result),
        'sourceSha256': hashlib.sha256(original).hexdigest(),
        'sha256': hashlib.sha256(result).hexdigest(),
        'sourceAnimationCount': original_count,
        'animations': [a['name'] for a in document['animations']],
    }


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    upstream = Path(sys.argv[1])
    assets = upstream / 'addons/kaykit_character_pack_adventures/Characters/gltf'
    output = Path(__file__).resolve().parents[1] / 'public/assets/characters/kaykit'
    output.mkdir(parents=True, exist_ok=True)
    manifest = {
        'source': 'https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0',
        'revision': '672074b73ba276876a19e8816ecdc5241817ab47',
        'license': 'CC0-1.0',
        'preparation': 'Selected animation clips; mesh, texture and retained keyframe bytes unchanged.',
        'models': [prepare(assets / f'{name}.glb', output / f'{name}.glb') for name in ['Knight', 'Barbarian']],
    }
    (output / 'LICENSE.txt').write_bytes((upstream / 'LICENSE.txt').read_bytes())
    (output / 'source.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    for model in manifest['models']:
        print(f"{model['source']}: {model['sourceBytes']} -> {model['bytes']} bytes; {len(model['animations'])} clips")
