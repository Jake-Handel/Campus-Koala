import os
from google.generativeai import configure, GenerativeModel
from google.generativeai.types import GenerationConfig
import logging

logger = logging.getLogger(__name__)

class GeminiAPI:
    def __init__(self):
        # Configure Gemini with API key
        configure(api_key=os.getenv('GEMINI_API_KEY'))
        self.client = GenerativeModel()
        self.model_name = "gemini-pro"
        self.generation_config = GenerationConfig(
            temperature=0.7,
            top_p=0.8,
            top_k=40,
            max_output_tokens=2048
        )

    def generate_response(self, prompt: str) -> str:
        try:
            # Create a system prompt with formatting instructions
            system_prompt = """
            You are a helpful AI assistant. Follow these instructions:
            1. Display responses in readable text with no markdown formatting or special characters
            2. Do not include any additional formatting or special characters
            3. Instead of bold or larger text, make breaks in text
            4. If you need to display a break, use a line break or a new paragraph
            
            User's prompt follows:
            """
            
            # Generate response
            response = self.client.generate_content(
                contents=[system_prompt, prompt],
                generation_config=self.generation_config
            )
            
            if not response:
                raise Exception("No response received from Gemini API")
                
            # Extract text from response
            if hasattr(response, 'text'):
                text = str(response.text)
            elif hasattr(response, 'candidates') and response.candidates:
                text = str(response.candidates[0].text)
            else:
                raise Exception("Invalid response format from Gemini API")
                
            # Clean up the response by removing any debug logs or unwanted text
            text = text.strip()
            
            # Remove any unwanted prefix if present
            if text.startswith("Response:") or text.startswith("Answer:"):
                text = text.split("\n", 1)[1].strip() if "\n" in text else text
            
            return text
                
        except Exception as e:
            logger.error(f"Error generating response: {str(e)}")
            raise Exception(f"Failed to generate response: {str(e)}")