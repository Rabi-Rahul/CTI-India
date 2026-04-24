import pandas as pd
import numpy as np
import os
from sentence_transformers import SentenceTransformer

def main():
    """
    Step 3: Feature Engineering using Hugging Face Sentence Transformers (MiniLM)
    This script converts the text input into 384-dimensional dense vectors
    and concatenates it with our structured data.
    """
    print("Step 3: Feature Engineering with Sentence Transformers (Option A)")
    
    # 1. Load Data
    data_path = 'data/processed_vulnerabilities.csv'
    print(f"Loading preprocessed data from: {data_path}")
    df = pd.read_csv(data_path)
    
    # Validate columns
    if 'description' not in df.columns or 'product' not in df.columns:
        raise ValueError("Dataset is missing 'description' or 'product' columns!")
        
    # Handle missing values: Fill nulls with empty string or "unknown"
    df['description'] = df['description'].fillna("")
    df['product'] = df['product'].fillna("unknown")
    
    # 2. Combine text (description + ' ' + product)
    print("Combining Description and Product for unified embedding representation...")
    combined_text = df['description'] + " " + df['product']
    
    # 3. Load Model (all-MiniLM-L6-v2)
    model_name = 'all-MiniLM-L6-v2'
    print(f"Loading Hugging Face model: {model_name}...")
    model = SentenceTransformer(model_name)
    
    # Bonus: Save embedding model locally for reuse in Step 6
    model_path = 'models/minilm_model'
    os.makedirs(model_path, exist_ok=True)
    model.save(model_path)
    print(f" -> Saved local copy of embedding model to {model_path}")
    
    # 4. Generate Embeddings
    print("Encoding text... (This may take a moment)")
    # Using show_progress_bar=True as requested to view encoding status in terminal
    embeddings = model.encode(combined_text.tolist(), show_progress_bar=True)
    
    print(f"Generated {embeddings.shape[0]} embeddings of length {embeddings.shape[1]}")
    
    # 5. Convert Embeddings to a Pandas DataFrame
    emb_cols = [f"emb_{i}" for i in range(embeddings.shape[1])]
    emb_df = pd.DataFrame(embeddings, columns=emb_cols)
    
    # 6. Concatenate with Structured Features
    # The final dataset must include embedding features, cvss_score, and label
    cols_to_keep = ['cve_id', 'cvss_normalized', 'exploited']
    # Safely filter existing columns
    cols_to_keep = [c for c in cols_to_keep if c in df.columns]
    
    df_structured = df[cols_to_keep].reset_index(drop=True)
    final_df = pd.concat([df_structured, emb_df], axis=1)
    
    print(f"Final feature dataset shape: {final_df.shape}")
    
    # 7. Output Result
    out_path = 'data/final_features.csv'
    final_df.to_csv(out_path, index=False)
    print(f"Success! Processed dataset exported to: {out_path}")

if __name__ == "__main__":
    main()
