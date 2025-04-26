from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.utils.gemini import GeminiAPI
from app.models.ai_conversation import AIConversation, AIMessage
from app import db
import logging

gemini_bp = Blueprint('gemini', __name__, url_prefix='/api/gemini')
gemini_api = GeminiAPI()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@gemini_bp.route('/generate', methods=['POST'])
@jwt_required()
def generate_response():
    try:
        data = request.json
        prompt = data.get('prompt')
        conversation_id = data.get('conversation_id')
        context = data.get('context', '')  # Optional context from previous messages
        
        if not prompt:
            return jsonify({'error': 'Prompt is required'}), 400
            
        # Get user_id from JWT
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify({'error': 'Authentication required'}), 401
            
        try:
            user_id = int(user_id)
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid user ID'}), 401
            
        # Get or create conversation
        conversation = None
        if conversation_id:
            conversation = AIConversation.get_conversation(conversation_id, user_id)
            if not conversation:
                return jsonify({'error': 'Conversation not found'}), 404
        else:
            conversation = AIConversation.create_conversation(user_id)
            
        # Build context from conversation history
        # Use provided context if available, otherwise build from conversation history
        if not context:
            context = ""
            for message in conversation.messages:
                context += f"\n{message.role}: {message.content}"
        context += f"\nuser: {prompt}"
        
        # Generate response
        response = gemini_api.generate_response(context)
        
        # Store messages
        user_message = AIMessage(
            role='user',
            content=prompt,
            conversation_id=conversation.id
        )
        db.session.add(user_message)
        
        assistant_message = AIMessage(
            role='assistant',
            content=response,
            conversation_id=conversation.id
        )
        db.session.add(assistant_message)
        
        db.session.commit()
        
        return jsonify({
            'response': response,
            'conversation_id': conversation.id,
            'history': [
                {'role': 'user', 'content': prompt},
                {'role': 'assistant', 'content': response}
            ],
            'context': context  # Return the context for future messages
        }), 200
        
    except Exception as e:
        logger.error(f"Error generating response: {str(e)}")
        return jsonify({'error': 'Failed to generate response'}), 500

@gemini_bp.route('/conversations', methods=['GET'])
@jwt_required()
def get_conversations():
    try:
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify({'error': 'Authentication required'}), 401
            
        try:
            user_id = int(user_id)
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid user ID'}), 401
            
        conversations = AIConversation.get_conversations(user_id)
        return jsonify({
            'conversations': [conv.to_dict() for conv in conversations]
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching conversations: {str(e)}")
        return jsonify({'error': str(e)}), 500

@gemini_bp.route('/conversation/<int:conversation_id>', methods=['GET'])
@jwt_required()
def get_conversation(conversation_id):
    try:
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify({'error': 'Authentication required'}), 401
            
        try:
            user_id = int(user_id)
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid user ID'}), 401
            
        conversation = AIConversation.get_conversation(conversation_id, user_id)
        if not conversation:
            return jsonify({'error': 'Conversation not found'}), 404
            
        return jsonify({
            'conversation': conversation.to_dict_with_messages()
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching conversation: {str(e)}")
        return jsonify({'error': str(e)}), 500

@gemini_bp.route('/conversation/<int:conversation_id>/activate', methods=['POST'])
@jwt_required()
def activate_conversation(conversation_id):
    try:
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify({'error': 'Authentication required'}), 401
            
        try:
            user_id = int(user_id)
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid user ID'}), 401
            
        conversation = AIConversation.get_conversation(conversation_id, user_id)
        if not conversation:
            return jsonify({'error': 'Conversation not found'}), 404
            
        AIConversation.activate_conversation(conversation_id)
        return jsonify({'message': 'Conversation activated successfully'}), 200
        
    except Exception as e:
        logger.error(f"Error activating conversation: {str(e)}")
        return jsonify({'error': str(e)}), 500

@gemini_bp.route('/conversation/<int:conversation_id>/deactivate', methods=['POST'])
@jwt_required()
def deactivate_conversation(conversation_id):
    try:
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify({'error': 'Authentication required'}), 401
            
        try:
            user_id = int(user_id)
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid user ID'}), 401
            
        conversation = AIConversation.get_conversation(conversation_id, user_id)
        if not conversation:
            return jsonify({'error': 'Conversation not found'}), 404
            
        AIConversation.deactivate_conversation(conversation_id)
        return jsonify({'message': 'Conversation deactivated successfully'}), 200
        
    except Exception as e:
        logger.error(f"Error deactivating conversation: {str(e)}")
        return jsonify({'error': str(e)}), 500

@gemini_bp.route('/conversation/<int:conversation_id>/title', methods=['PUT'])
@jwt_required()
def update_conversation_title(conversation_id):
    try:
        data = request.json
        new_title = data.get('title')
        
        if not new_title:
            return jsonify({'error': 'Title is required'}), 400
            
        # Get user_id from JWT
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify({'error': 'Authentication required'}), 401
            
        try:
            user_id = int(user_id)
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid user ID'}), 401
            
        # Get the conversation
        conversation = AIConversation.get_conversation(conversation_id, user_id)
        if not conversation:
            return jsonify({'error': 'Conversation not found'}), 404
            
        # Verify user owns the conversation
        if conversation.user_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403
            
        # Update the title
        conversation.title = new_title
        db.session.commit()
        
        return jsonify({
            'conversation': {
                'id': conversation.id,
                'title': conversation.title,
                'created_at': conversation.created_at.isoformat(),
                'updated_at': conversation.updated_at.isoformat(),
                'messages': len(conversation.messages)
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error updating conversation title: {str(e)}")
        return jsonify({'error': 'Failed to update conversation title'}), 500

@gemini_bp.route('/conversation/<int:conversation_id>/context', methods=['GET'])
@jwt_required()
def get_conversation_context(conversation_id):
    """Get the context of a conversation"""
    try:
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify({'error': 'Authentication required'}), 401
            
        try:
            user_id = int(user_id)
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid user ID'}), 401
            
        conversation = AIConversation.get_conversation(conversation_id, user_id)
        if not conversation:
            return jsonify({'error': 'Conversation not found'}), 404
            
        # Build context from conversation messages
        context = ""
        for message in conversation.messages:
            context += f"\n{message.role}: {message.content}"
            
        return jsonify({
            'context': context
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting conversation context: {str(e)}")
        return jsonify({'error': str(e)}), 500

@gemini_bp.route('/conversation/<int:conversation_id>', methods=['DELETE'])
@jwt_required()
def delete_conversation(conversation_id):
    try:
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify({'error': 'Authentication required'}), 401

        try:
            user_id = int(user_id)
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid user ID'}), 401

        conversation = AIConversation.get_conversation(conversation_id, user_id)
        if not conversation:
            return jsonify({'error': 'Conversation not found'}), 404

        try:
            # Delete all messages associated with this conversation
            AIMessage.query.filter_by(conversation_id=conversation_id).delete()
            
            # Delete the conversation itself
            db.session.delete(conversation)
            db.session.commit()
            
            return jsonify({'message': 'Conversation deleted successfully'}), 200
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error deleting conversation: {str(e)}")
            return jsonify({'error': 'Failed to delete conversation'}), 500
            
    except Exception as e:
        logger.error(f"Error in delete_conversation: {str(e)}")
        return jsonify({'error': 'Failed to delete conversation'}), 500

@gemini_bp.route('/history', methods=['GET'])
@jwt_required()
def get_chat_history():
    try:
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify({'error': 'Authentication required'}), 401
            
        try:
            user_id = int(user_id)
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid user ID'}), 401
            
        # Get all conversations for user, ordered by most recent
        conversations = AIConversation.get_conversations(user_id)
        
        return jsonify({
            'history': [conv.to_dict() for conv in conversations]
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching chat history: {str(e)}")
        return jsonify({'error': str(e)}), 500