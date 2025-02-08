from datetime import datetime
from typing import Dict, Any, Optional

def parse_datetime(date_str: Optional[str]) -> Optional[datetime]:
    """Convert ISO format datetime string to datetime object"""
    if not date_str:
        return None
    try:
        return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
    except ValueError:
        return None

def validate_request_data(data: Dict[str, Any], required_fields: list) -> tuple[bool, Optional[str]]:
    """Validate that all required fields are present in the request data"""
    if not all(field in data for field in required_fields):
        missing_fields = [field for field in required_fields if field not in data]
        return False, f"Missing required fields: {', '.join(missing_fields)}"
    return True, None

def calculate_game_time(study_duration: int) -> int:
    """Calculate game time earned based on study duration"""
    # For every hour studied, earn 15 minutes of game time
    return (study_duration // 60) * 15
