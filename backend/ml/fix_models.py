"""
Fix model compatibility by reloading and resaving with current NumPy version
"""
import os
import sys
import joblib
import pickle

def fix_model(model_path):
    """Reload and resave a model file"""
    print(f"Processing: {model_path}")
    try:
        # Try loading with joblib
        model = joblib.load(model_path)
        # Resave with current version
        joblib.dump(model, model_path)
        print(f"  ✓ Successfully fixed: {model_path}")
        return True
    except Exception as e:
        print(f"  ✗ Failed to fix {model_path}: {e}")
        return False

def main():
    models_dir = os.path.join(os.path.dirname(__file__), 'models')
    
    if not os.path.exists(models_dir):
        print(f"Models directory not found: {models_dir}")
        sys.exit(1)
    
    pkl_files = []
    for root, dirs, files in os.walk(models_dir):
        for file in files:
            if file.endswith('.pkl'):
                pkl_files.append(os.path.join(root, file))
    
    if not pkl_files:
        print("No .pkl files found in models directory")
        sys.exit(1)
    
    print(f"Found {len(pkl_files)} model files to fix\n")
    
    success_count = 0
    for pkl_file in pkl_files:
        if fix_model(pkl_file):
            success_count += 1
    
    print(f"\n{success_count}/{len(pkl_files)} models fixed successfully")
    
    if success_count == len(pkl_files):
        print("\n✓ All models are now compatible!")
        sys.exit(0)
    else:
        print("\n✗ Some models could not be fixed")
        sys.exit(1)

if __name__ == "__main__":
    main()
