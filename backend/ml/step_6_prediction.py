import pandas as pd
import numpy as np
import joblib
import re
import os
import warnings
from sentence_transformers import SentenceTransformer

# Fix for NumPy compatibility issues with older pickled models
import numpy.random._pickle
warnings.filterwarnings('ignore', category=UserWarning)

def clean_text(text):
    if pd.isna(text):
        return ""
    text = str(text).lower()
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

class CVEPredictor:
    def __init__(self, model_dir='models'):
        print("Loading prediction pipeline and models...")
        self.model_dir = model_dir
        
        # Load models with compatibility handling
        try:
            self.cvss_scaler = joblib.load(os.path.join(model_dir, 'cvss_scaler.pkl'))
        except Exception as e:
            print(f"Warning loading cvss_scaler: {e}")
            # Try with allow_pickle enabled
            import pickle
            with open(os.path.join(model_dir, 'cvss_scaler.pkl'), 'rb') as f:
                self.cvss_scaler = pickle.load(f)
        
        print("Loading local MiniLM embeddings model...")
        self.transformer = SentenceTransformer(os.path.join(model_dir, 'minilm_model'))
        
        # We explicitly load the gradient boosting model updated in Step 4
        # If gradient_boosting fails, fallback to random_forest
        try:
            self.model = joblib.load(os.path.join(model_dir, 'gradient_boosting.pkl'))
            print("Using Gradient Boosting model")
        except Exception as e:
            print(f"Warning: Could not load gradient_boosting.pkl: {e}")
            print("Falling back to Random Forest model...")
            try:
                self.model = joblib.load(os.path.join(model_dir, 'random_forest.pkl'))
                print("Using Random Forest model")
            except Exception as e2:
                print(f"Warning: Could not load random_forest.pkl: {e2}")
                print("Falling back to Logistic Regression model...")
                self.model = joblib.load(os.path.join(model_dir, 'logistic_regression.pkl'))
                print("Using Logistic Regression model")
        
    def predict(self, cve_id, cvss_score, description, product):
        print(f"\\n--- Predicting for {cve_id} ---")
        
        # 1. Preprocess & Combine Data identically to Step 3
        desc_clean = clean_text(description)
        combined_text = f"{desc_clean} {product}"
        
        # Scale CVSS
        cvss_scaled = self.cvss_scaler.transform([[cvss_score]])[0][0]
        # We only kept cvss_normalized
        df_structured = pd.DataFrame({
            'cvss_normalized': [cvss_scaled]
        })
        
        # 2. Extract Embeddings (disable progress bar for individual inferences)
        embedding = self.transformer.encode([combined_text], show_progress_bar=False)
        emb_cols = [f"emb_{i}" for i in range(embedding.shape[1])]
        emb_df = pd.DataFrame(embedding, columns=emb_cols)
        
        # 3. Compile Input Vector
        # Ensure it matches model expectations (e.g. cvss_normalized + emb_X...)
        X_input = pd.concat([df_structured, emb_df], axis=1)
        
        # Predict Probabilities
        prob = self.model.predict_proba(X_input)[0][1] # P(Exploited = 1)
        pred_class = self.model.predict(X_input)[0]
        
        # Convert to Risk
        risk_score = round(prob * 100, 2)
        if risk_score >= 75:
            priority = "CRITICAL"
        elif risk_score >= 50:
            priority = "HIGH"
        elif risk_score >= 25:
            priority = "MEDIUM"
        else:
            priority = "LOW"
            
        print(f"Prediction Results:")
        print(f"  - Exploitation Probability: {risk_score}%")
        print(f"  - Recommended Priority: {priority}")
        print(f"  - Classified Label: {'Exploited' if pred_class == 1 else 'Not Exploited'}\\n")
        
        return {
            'cve_id': cve_id,
            'risk_score': risk_score,
            'priority': priority,
            'class': pred_class
        }

if __name__ == "__main__":
    predictor = CVEPredictor()
    
    # Test case 1
    cve1 = {
        'cve_id': 'CVE-NEW-0001',
        'cvss_score': 9.8,
        'description': 'A critical remote code execution vulnerability exists in the web server allowing unauthenticated attackers to execute arbitrary shell commands via crafted HTTP requests.',
        'product': 'webcart'
    }
    predictor.predict(**cve1)
