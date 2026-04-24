import pandas as pd
import numpy as np
import re
import joblib
import os
import json
from sklearn.preprocessing import LabelEncoder, StandardScaler

def clean_text(text):
    if pd.isna(text):
        return ""
    # Lowercase
    text = str(text).lower()
    # Remove punctuation/symbols (keep alphanumeric and spaces)
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    # Remove extra spaces
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def main():
    print("Step 2: Data Preprocessing Initialization")
    
    # 1. Load dataset
    data_path = 'data/cve_part_1.json'
    print(f"Loading data from: {data_path}")
    
    with open(data_path, 'r', encoding='utf-8') as file:
        data_json = json.load(file)
        
    df = pd.DataFrame(data_json)
    print(f"Loaded {len(df)} records. Columns: {df.columns.tolist()}")
    
    # 2. Handle missing values
    print("Handling missing values...")
    # cvss: fill with median
    if 'cvss' in df.columns:
        median_cvss = df['cvss'].median()
        df['cvss'] = df['cvss'].fillna(median_cvss)
    
    # description: fill with empty string
    if 'description' in df.columns:
        df['description'] = df['description'].fillna("")
        
    # product: fill with unknown
    if 'product' in df.columns:
        df['product'] = df['product'].fillna("unknown")
    
    # 3. Clean text
    print("Cleaning text descriptions...")
    if 'description' in df.columns:
        df['description'] = df['description'].apply(clean_text)
        
    # Create models directory to save encoders
    os.makedirs('models', exist_ok=True)
    
    # 4. Encode categorical variables
    print("Encoding categorical variable 'product'...")
    if 'product' in df.columns:
        le = LabelEncoder()
        df['product_encoded'] = le.fit_transform(df['product'])
        joblib.dump(le, 'models/product_encoder.pkl')
        print(" -> Saved Product LabelEncoder to models/product_encoder.pkl")
    
    # 5. Normalize numerical values
    print("Normalizing numerical variable 'cvss'...")
    if 'cvss' in df.columns:
        scaler = StandardScaler()
        # Reshape for scalar fitting
        df['cvss_normalized'] = scaler.fit_transform(df[['cvss']])
        joblib.dump(scaler, 'models/cvss_scaler.pkl')
        print(" -> Saved CVSS StandardScaler to models/cvss_scaler.pkl")
    
    # Filter to desired columns (we keep original description for TFIDF and cve_id for index)
    output_cols = ['cve_id', 'description', 'cvss', 'cvss_normalized', 
                   'product', 'product_encoded', 'exploited']
    # Ensuring only existing columns are added
    output_cols = [col for col in output_cols if col in df.columns]
    df_out = df[output_cols]
    
    # 6. Save processed output
    out_path = 'data/processed_vulnerabilities.csv'
    df_out.to_csv(out_path, index=False)
    print(f"Success! Processed data saved to {out_path} with {len(df_out)} records.")

if __name__ == "__main__":
    main()
