import json
import logging
from docling.document_converter import DocumentConverter

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    logger.info("Received event: %s", json.dumps(event))
    
    try:
        # In production, this event will come from S3.
        # For local testing, we'll just check if the event passed a "test_mode" flag
        if event.get("test_mode"):
            return {
                "statusCode": 200,
                "body": json.dumps({
                    "message": "Lambda is running perfectly!",
                    "docling_available": True
                })
            }
        
        # --- Real S3 Logic would go here ---
        # 1. Parse event for S3 Bucket and Key
        # 2. Download file to /tmp/
        # 3. Run docling
        
        return {
            "statusCode": 200,
            "body": json.dumps("Processing completed successfully.")
        }
        
    except Exception as e:
        logger.error("Error processing document: %s", str(e))
        return {
            "statusCode": 500,
            "body": json.dumps(f"Error: {str(e)}")
        }