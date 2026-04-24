"""
Fix gradient boosting model with sklearn compatibility
"""
import os
import sys
import pickle
import joblib
import numpy as np
import sklearn

def fix_gradient_boosting():
    model_path = os.path.join(os.path.dirname(__file__), 'models', 'gradient_boosting.pkl')
    
    print(f"Fixing gradient boosting model: {model_path}")
    print(f"NumPy version: {np.__version__}")
    print(f"Scikit-learn version: {sklearn.__version__}")
    
    # Backup original file
    backup_path = model_path + '.backup'
    if not os.path.exists(backup_path):
        import shutil
        shutil.copy(model_path, backup_path)
        print(f"  Created backup: {backup_path}")
    
    try:
        # Try with pickle protocol compatibility
        with open(model_path, 'rb') as f:
            # Read raw bytes
            data = f.read()
        
        # Try to load with different protocols
        for encoding in ['bytes', 'latin1', 'ASCII']:
            try:
                print(f"  Trying encoding: {encoding}")
                model = pickle.loads(data, encoding=encoding)
                print(f"  ✓ Successfully loaded with encoding: {encoding}")
                
                # Resave with current version
                joblib.dump(model, model_path, protocol=pickle.HIGHEST_PROTOCOL)
                print(f"  ✓ Successfully resaved: {model_path}")
                
                # Verify it can be loaded normally now
                test_model = joblib.load(model_path)
                print("  ✓ Verified: Model can now be loaded normally")
                
                return True
            except Exception as e:
                print(f"    Failed with {encoding}: {type(e).__name__}")
                continue
        
        return False
    except Exception as e:
        print(f"  ✗ Failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    if fix_gradient_boosting():
        print("\n✓ Gradient boosting model fixed successfully!")
        sys.exit(0)
    else:
        print("\n✗ Failed to fix gradient boosting model")
        sys.exit(1)
