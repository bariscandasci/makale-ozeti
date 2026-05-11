#!/usr/bin/env python3
"""
Fine-tune BART model with training data from MongoDB
Usage: python train_model.py
"""

import os
import sys
import logging
from pathlib import Path
from typing import List, Dict, Tuple

import torch
import numpy as np
import pandas as pd
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from transformers import (
    BartForConditionalGeneration,
    BartTokenizer,
    Trainer,
    TrainingArguments,
    DataCollatorForSeq2Seq,
)
from datasets import Dataset
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://127.0.0.1:27017/makale-ozeti')
MODEL_NAME = 'facebook/bart-large-cnn'
OUTPUT_DIR = './trained_model'
EPOCHS = 3
BATCH_SIZE = 2
LEARNING_RATE = 1e-5
WARMUP_STEPS = 500
WEIGHT_DECAY = 0.01
MAX_INPUT_LENGTH = 512
MAX_TARGET_LENGTH = 128


def get_mongo_connection() -> MongoClient:
    """Connect to MongoDB with error handling."""
    try:
        logger.info(f'Connecting to MongoDB: {MONGODB_URI}')
        client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        # Verify connection
        client.admin.command('ping')
        logger.info('✅ MongoDB connection successful')
        return client
    except (ConnectionFailure, ServerSelectionTimeoutError) as e:
        logger.error(f'❌ MongoDB connection failed: {e}')
        sys.exit(1)


def fetch_training_data(db) -> List[Dict[str, str]]:
    """Fetch training data from MongoDB."""
    try:
        logger.info('Fetching training data from MongoDB...')
        collection = db['trainingdatas']
        
        data = list(collection.find({}, {'text': 1, 'summary': 1, '_id': 1}))
        
        if not data:
            logger.warning('⚠️ No training data found in database')
            return []
        
        logger.info(f'✅ Loaded {len(data)} training samples')
        
        # Validate data
        valid_data = []
        for item in data:
            if item.get('text') and item.get('summary'):
                valid_data.append({
                    'text': str(item['text']).strip(),
                    'summary': str(item['summary']).strip(),
                })
            else:
                logger.warning(f'Skipping invalid record: {item.get("_id")}')
        
        if not valid_data:
            logger.error('No valid training data found')
            return []
        
        logger.info(f'✅ {len(valid_data)} valid training samples')
        return valid_data
    
    except Exception as e:
        logger.error(f'Error fetching training data: {e}')
        sys.exit(1)


def prepare_dataset(training_data: List[Dict[str, str]], tokenizer) -> Dataset:
    """Prepare dataset for training."""
    try:
        logger.info('Preparing dataset...')
        
        # Create DataFrame
        df = pd.DataFrame(training_data)
        
        # Tokenize
        encodings = tokenizer(
            df['text'].tolist(),
            max_length=MAX_INPUT_LENGTH,
            truncation=True,
            padding='max_length',
            return_tensors='pt'
        )
        
        target_encodings = tokenizer(
            df['summary'].tolist(),
            max_length=MAX_TARGET_LENGTH,
            truncation=True,
            padding='max_length',
            return_tensors='pt'
        )
        
        # Create dataset
        dataset_dict = {
            'input_ids': encodings['input_ids'],
            'attention_mask': encodings['attention_mask'],
            'labels': target_encodings['input_ids'],
        }
        
        dataset = Dataset.from_dict(dataset_dict)
        logger.info(f'✅ Dataset prepared: {len(dataset)} samples')
        
        return dataset
    
    except Exception as e:
        logger.error(f'Error preparing dataset: {e}')
        sys.exit(1)


def train_model(dataset: Dataset, tokenizer, model):
    """Train the model."""
    try:
        logger.info('Starting model training...')
        
        # Create training arguments
        training_args = TrainingArguments(
            output_dir=OUTPUT_DIR,
            num_train_epochs=EPOCHS,
            per_device_train_batch_size=BATCH_SIZE,
            save_steps=10,
            save_total_limit=2,
            logging_steps=5,
            learning_rate=LEARNING_RATE,
            warmup_steps=WARMUP_STEPS,
            weight_decay=WEIGHT_DECAY,
            logging_dir='./logs',
            report_to=[],  # Disable wandb/tensorboard
        )
        
        # Data collator
        data_collator = DataCollatorForSeq2Seq(
            tokenizer,
            model=model,
            label_pad_token_id=-100,
        )
        
        # Create trainer
        trainer = Trainer(
            model=model,
            args=training_args,
            train_dataset=dataset,
            data_collator=data_collator,
        )
        
        # Train
        logger.info(f'Training for {EPOCHS} epochs with batch size {BATCH_SIZE}...')
        trainer.train()
        
        logger.info('✅ Training completed')
        
        return model
    
    except Exception as e:
        logger.error(f'Error during training: {e}')
        sys.exit(1)


def save_model(model, tokenizer):
    """Save trained model and tokenizer."""
    try:
        logger.info(f'Saving model to {OUTPUT_DIR}...')
        
        # Create output directory
        Path(OUTPUT_DIR).mkdir(exist_ok=True)
        
        # Save model and tokenizer
        model.save_pretrained(OUTPUT_DIR)
        tokenizer.save_pretrained(OUTPUT_DIR)
        
        logger.info(f'✅ Model saved to {OUTPUT_DIR}')
        logger.info(f'Files: {list(Path(OUTPUT_DIR).glob("*"))}')
    
    except Exception as e:
        logger.error(f'Error saving model: {e}')
        sys.exit(1)


def main():
    """Main training pipeline."""
    logger.info('=' * 60)
    logger.info('BART Model Fine-tuning Pipeline')
    logger.info('=' * 60)
    
    # Check GPU availability
    if torch.cuda.is_available():
        logger.info(f'✅ GPU available: {torch.cuda.get_device_name(0)}')
    else:
        logger.info('⚠️ GPU not available, using CPU (training will be slower)')
    
    # Connect to MongoDB
    client = get_mongo_connection()
    db = client['makale-ozeti']
    
    # Fetch training data
    training_data = fetch_training_data(db)
    
    if not training_data:
        logger.error('Cannot proceed without training data')
        sys.exit(1)
    
    # Load model and tokenizer
    logger.info(f'Loading model: {MODEL_NAME}')
    tokenizer = BartTokenizer.from_pretrained(MODEL_NAME)
    model = BartForConditionalGeneration.from_pretrained(MODEL_NAME)
    logger.info('✅ Model and tokenizer loaded')
    
    # Prepare dataset
    dataset = prepare_dataset(training_data, tokenizer)
    
    if len(dataset) == 0:
        logger.error('Dataset is empty')
        sys.exit(1)
    
    # Train model
    model = train_model(dataset, tokenizer, model)
    
    # Save model
    save_model(model, tokenizer)
    
    # Cleanup
    client.close()
    logger.info('=' * 60)
    logger.info('✅ Training pipeline completed successfully')
    logger.info('=' * 60)


if __name__ == '__main__':
    main()
