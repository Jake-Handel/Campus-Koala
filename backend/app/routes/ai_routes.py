from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.utils.gemini import GeminiAPI
from app.models.ai_conversation import AIConversation, AIMessage
from app import db
import logging

gemini_bp = Blueprint('gemini', __name__)
gemini_api = GeminiAPI()
logging.basicConfig(level=logging.DEBUG)

@gemini_bp.route('/api/gemini/generate', methods=['POST'])
def generate_response():
    try:
        logging.debug("Received request to generate response")
        data = request.json
        logging.debug(f"Request data: {data}")
        
        prompt = data.get('prompt')
        conversation_id = data.get('conversation_id')
        
        if not prompt:
            return jsonify({'error': 'Prompt is required'}), 400
        
        logging.debug("Generating response using Gemini API")
        response = gemini_api.generate_response(prompt)
        
        logging.debug("Storing messages in database")
        try:
            # Create new conversation if none exists
            if not conversation_id:
                conversation = AIConversation()
                db.session.add(conversation)
                db.session.commit()
                conversation_id = conversation.id
            
            # Store user message
            user_message = AIMessage(
                conversation_id=conversation_id,
                role='user',
                content=prompt
            )
            db.session.add(user_message)
            
            # Store AI response
            assistant_message = AIMessage(
                conversation_id=conversation_id,
                role='assistant',
                content=response
            )
            db.session.add(assistant_message)
            db.session.commit()
            
        except Exception as e:
            db.session.rollback()
            logging.error(f"Database error: {str(e)}")
            return jsonify({
                'error': 'Failed to store messages in database',
                'response': response
            }), 200
        
        logging.debug("Successfully processed request")
        return jsonify({
            'response': response,
            'conversation_id': conversation_id
        })
        
    except Exception as e:
        logging.error(f"Error in generate_response: {str(e)}")
        return jsonify({
            'error': 'Failed to generate response',
            'message': str(e)
        }), 500