import os
from google.generativeai import configure, GenerativeModel
from google.generativeai.types import GenerationConfig
import logging

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
            # Generate response with proper configuration
            response = self.client.generate_content(
                contents=[prompt],
                generation_config=self.generation_config
            )
            
            if not response:
                raise Exception("No response received from Gemini API")
                
            # Extract text from response
            if hasattr(response, 'text'):
                return str(response.text)
            elif hasattr(response, 'candidates') and response.candidates:
                return str(response.candidates[0].text)
            else:
                raise Exception("Invalid response format from Gemini API")
                
        except Exception as e:
            logging.error(f"Error generating response: {str(e)}")
            raise Exception(f"Failed to generate response: {str(e)}")