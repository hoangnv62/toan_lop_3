import mysql.connector
import re
import json
from config import db_config  # Import từ config


def get_db():
    try:
        return mysql.connector.connect(**db_config)
    except:
        return None


def clean_json_string(text):
    try:
        match = re.search(r"\[.*\]", text, re.DOTALL)
        return match.group(0) if match else "[]"
    except:
        return "[]"
