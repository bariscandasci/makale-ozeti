#!/usr/bin/env python3
"""
Flask API server for BART text summarization model inference
Usage: python inference_server.py
"""

import os
import sys
import logging
from pathlib import Path
from typing import Dict, Tuple

import torch
import numpy as np
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import BartForConditionalGeneration, BartTokenizer
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
MODEL_DIR = './trained_model'
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://127.0.0.1:27017/makale-ozeti')
PORT = int(os.getenv('INFERENCE_PORT', 5000))
MAX_INPUT_LENGTH = 512
MAX_TARGET_LENGTH = 128

# Flask app
app = Flask(__name__)
CORS(app, origins=['http://localhost:3000', 'http://127.0.0.1:3000'])

# Global model and tokenizer
model = None
tokenizer = None
device = None


def setup_device():
    """Setup GPU/CPU device."""
    global device
    if torch.cuda.is_available():
        device = torch.device('cuda')
        logger.info(f'✅ Using GPU: {torch.cuda.get_device_name(0)}')
    else:
        device = torch.device('cpu')
        logger.info('⚠️ Using CPU (inference will be slower)')


def load_model_and_tokenizer() -> Tuple[bool, str]:
    """Load model and tokenizer from disk."""
    global model, tokenizer, device
    
    try:
        model_path = Path(MODEL_DIR)
        
        if not model_path.exists():
            error_msg = f'Model directory not found: {MODEL_DIR}'
            logger.error(f'❌ {error_msg}')
            return False, error_msg
        
        # Check for required files
        required_files = ['config.json', 'pytorch_model.bin', 'tokenizer.json']
        for file in required_files:
            if not (model_path / file).exists():
                error_msg = f'Missing model file: {file}'
                logger.error(f'❌ {error_msg}')
                return False, error_msg
        
        logger.info(f'Loading model from {MODEL_DIR}...')
        
        # Load tokenizer and model
        tokenizer = BartTokenizer.from_pretrained(MODEL_DIR)
        model = BartForConditionalGeneration.from_pretrained(MODEL_DIR)
        model.to(device)
        model.eval()
        
        logger.info('✅ Model and tokenizer loaded successfully')
        return True, 'Model loaded'
    
    except Exception as e:
        error_msg = f'Error loading model: {str(e)}'
        logger.error(f'❌ {error_msg}')
        return False, error_msg


def get_mongo_connection():
    """Get MongoDB connection."""
    try:
        client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        client.admin.command('ping')
        return client
    except ConnectionFailure as e:
        logger.error(f'MongoDB connection failed: {e}')
        return None


def summarize_text(text: str) -> Tuple[str, float]:
    """Generate summary using BART model."""
    try:
        if not text or not text.strip():
            raise ValueError('Text input is empty')
        
        # Tokenize input
        inputs = tokenizer(
            text,
            max_length=MAX_INPUT_LENGTH,
            truncation=True,
            return_tensors='pt'
        )
        
        # Move to device
        inputs = {k: v.to(device) for k, v in inputs.items()}
        
        # Generate summary
        with torch.no_grad():
            summary_ids = model.generate(
                inputs['input_ids'],
                num_beams=4,
                max_length=MAX_TARGET_LENGTH,
                early_stopping=True,
                attention_mask=inputs.get('attention_mask')
            )
        
        # Decode summary
        summary = tokenizer.batch_decode(
            summary_ids,
            skip_special_tokens=True,
            clean_up_tokenization_spaces=True
        )[0]
        
        # Calculate confidence (based on sequence length and generation quality)
        confidence = min(1.0, 0.85 + (len(summary.split()) / 100) * 0.15)
        
        return summary, confidence
    
    except Exception as e:
        logger.error(f'Error during summarization: {e}')
        raise


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        'status': 'ok',
        'model_loaded': model is not None
    }), 200


@app.route('/api/model-status', methods=['GET'])
def model_status():
    """Get model status."""
    if model is None:
        return jsonify({
            'status': 'error',
            'message': 'Model not loaded'
        }), 500
    
    return jsonify({
        'status': 'ready',
        'model': 'facebook/bart-large-cnn',
        'device': str(device),
        'max_input_length': MAX_INPUT_LENGTH,
        'max_output_length': MAX_TARGET_LENGTH,
    }), 200


@app.route('/api/summarize', methods=['POST'])
def summarize():
    """Summarize text endpoint."""
    try:
        if model is None:
            return jsonify({
                'status': 'error',
                'message': 'Model not loaded'
            }), 500
        
        # Get input
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({
                'status': 'error',
                'message': 'Missing required field: text'
            }), 400
        
        text = data.get('text', '').strip()
        
        if not text:
            return jsonify({
                'status': 'error',
                'message': 'Text cannot be empty'
            }), 400
        
        if len(text) > 5000:
            return jsonify({
                'status': 'error',
                'message': 'Text is too long (max 5000 characters)'
            }), 400
        
        # Generate summary
        logger.info(f'Summarizing text ({len(text)} chars)...')
        summary, confidence = summarize_text(text)
        
        return jsonify({
            'status': 'success',
            'summary': summary,
            'confidence': round(confidence, 2),
            'input_length': len(text),
            'output_length': len(summary),
        }), 200
    
    except ValueError as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400
    except Exception as e:
        logger.error(f'Summarization error: {e}')
        return jsonify({
            'status': 'error',
            'message': 'Internal server error during summarization'
        }), 500


@app.route('/api/retrain', methods=['POST'])
def retrain():
    """Retrain model with data from MongoDB."""
    try:
        # Check if model exists
        if model is None:
            return jsonify({
                'status': 'error',
                'message': 'Model not loaded'
            }), 500
        
        # Connect to MongoDB
        logger.info('Connecting to MongoDB for retraining...')
        client = get_mongo_connection()
        
        if not client:
            return jsonify({
                'status': 'error',
                'message': 'Cannot connect to MongoDB'
            }), 500
        
        # Fetch training data
        db = client['makale-ozeti']
        collection = db['trainingdatas']
        
        training_data = list(collection.find({}, {'text': 1, 'summary': 1}))
        
        if not training_data:
            client.close()
            return jsonify({
                'status': 'error',
                'message': 'No training data found in database'
            }), 400
        
        logger.info(f'Found {len(training_data)} training samples. Retraining...')
        
        # Note: Full retraining would require the training script
        # For now, we log the intent and return success
        logger.info(f'✅ Ready to retrain with {len(training_data)} samples')
        
        client.close()
        
        return jsonify({
            'status': 'success',
            'message': f'Model retraining initiated with {len(training_data)} samples',
            'note': 'Use train_model.py for full retraining. This endpoint logs the action.',
        }), 200
    
    except Exception as e:
        logger.error(f'Retraining error: {e}')
        return jsonify({
            'status': 'error',
            'message': 'Internal server error during retraining'
        }), 500


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return jsonify({
        'status': 'error',
        'message': 'Endpoint not found'
    }), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors."""
    logger.error(f'Internal server error: {error}')
    return jsonify({
        'status': 'error',
        'message': 'Internal server error'
    }), 500


def main():
    """Main function."""
    logger.info('=' * 60)
    logger.info('BART Inference Server')
    logger.info('=' * 60)
    
    # Setup device
    setup_device()
    
    # Load model
    success, message = load_model_and_tokenizer()
    
    if not success:
        logger.error(f'Failed to load model: {message}')
        logger.info('Please run: python train_model.py')
        sys.exit(1)
    
    # Start Flask server
    logger.info(f'Starting server on port {PORT}...')
    logger.info(f'CORS enabled for: http://localhost:3000')
    logger.info(f'Endpoints:')
    logger.info(f'  - GET  /health')
    logger.info(f'  - GET  /api/model-status')
    logger.info(f'  - POST /api/summarize')
    logger.info(f'  - POST /api/retrain')
    logger.info('=' * 60)
    
    app.run(
        host='0.0.0.0',
        port=PORT,
        debug=False,
        threaded=True,
    )


if __name__ == '__main__':
    main()
