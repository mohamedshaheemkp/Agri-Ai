import os
import shutil
from pathlib import Path

# Configuration
BASE_DIR = Path(r"c:\Users\Shaheem\MS\ORIGINS\CODE\MAIN PROJECT\Agri-monitoring system\Agri-bot-system\Dataset")
DEST_DIR = BASE_DIR / "master_dataset"

DATASETS = [
    {"name": "pest_detection", "offset": 0},      # Classes 0-7
    {"name": "disesase_detection", "offset": 8},  # Classes 0-11 -> 8-19
    {"name": "weeds_detecion", "offset": 20}      # Class 0 -> 20
]

SPLITS = ["train", "valid", "test"]

# Unified class names list in the exact new order
CLASS_NAMES = [
    # Pests (0-7)
    'Beet armyworm', 'Cotton bollworm', 'Green peach aphid', 'Silverleaf whitefly', 
    'Tobacco cutworm', 'melon fly', 'melon thrips', 'spider mite',
    # Diseases (8-19)
    'Beans_Angular_LeafSpot', 'Beans_Rust', 'Strawberry_Angular_LeafSpot', 
    'Strawberry_Anthracnose_Fruit_Rot', 'Strawberry_Blossom_Blight', 'Strawberry_Gray_Mold', 
    'Strawberry_Leaf_Spot', 'Strawberry_Powdery_Mildew_Fruit', 'Strawberry_Powdery_Mildew_Leaf', 
    'Tomato_Blight', 'Tomato_Leaf_Mold', 'Tomato_Spider_Mites',
    # Weeds (20)
    'Weeds'
]

def setup_directories():
    if DEST_DIR.exists():
        print(f"Warning: {DEST_DIR} already exists. Removing it for a clean merge...")
        shutil.rmtree(DEST_DIR)
    
    for split in SPLITS:
        (DEST_DIR / split / "images").mkdir(parents=True, exist_ok=True)
        (DEST_DIR / split / "labels").mkdir(parents=True, exist_ok=True)

def process_label_file(src_path, dest_path, offset):
    if not src_path.exists():
        return
    
    with open(src_path, 'r') as f_in, open(dest_path, 'w') as f_out:
        for line in f_in:
            parts = line.strip().split()
            if not parts:
                continue
            
            # The first value is the class ID
            original_class_id = int(parts[0])
            new_class_id = original_class_id + offset
            
            # Rewrite the line with the new class ID
            parts[0] = str(new_class_id)
            f_out.write(" ".join(parts) + "\n")

def merge_datasets():
    print("Starting dataset merge...")
    setup_directories()

    for ds in DATASETS:
        ds_path = BASE_DIR / ds["name"]
        offset = ds["offset"]
        print(f"\nProcessing {ds['name']} (Offset: +{offset})...")

        for split in SPLITS:
            img_dir = ds_path / split / "images"
            lbl_dir = ds_path / split / "labels"
            
            if not img_dir.exists():
                print(f"  Warning: Split {split} not found in {ds['name']}")
                continue

            for img_file in img_dir.glob("*.*"):
                # Safe copying logic to prevent overwriting
                dest_img_path = DEST_DIR / split / "images" / img_file.name
                base_name = img_file.stem
                ext = img_file.suffix
                counter = 1
                
                while dest_img_path.exists():
                    dest_img_path = DEST_DIR / split / "images" / f"{base_name}_{counter}{ext}"
                    counter += 1

                # Copy image
                shutil.copy2(img_file, dest_img_path)

                # Process corresponding label (.txt) file
                src_lbl_path = lbl_dir / f"{img_file.stem}.txt"
                dest_lbl_path = DEST_DIR / split / "labels" / f"{dest_img_path.stem}.txt"
                process_label_file(src_lbl_path, dest_lbl_path, offset)

    print("\nImages and rewritten labels successfully merged!")

def generate_yaml():
    yaml_path = DEST_DIR / "data.yaml"
    with open(yaml_path, "w") as f:
        f.write(f"train: ../Dataset/master_dataset/train/images\n")
        f.write(f"val: ../Dataset/master_dataset/valid/images\n")
        f.write(f"test: ../Dataset/master_dataset/test/images\n\n")
        f.write(f"nc: {len(CLASS_NAMES)}\n\n")
        f.write(f"names: {CLASS_NAMES}\n")
    print(f"Generated unified data.yaml at {yaml_path}")

if __name__ == "__main__":
    merge_datasets()
    generate_yaml()
    print("Merge complete. Your master dataset is ready for training!")
