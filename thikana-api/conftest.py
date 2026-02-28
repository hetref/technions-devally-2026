"""
conftest.py

Adds the project root to sys.path so pytest and direct script execution
can find the core/, db/, and routes/ packages without installing the project.
"""

import sys
from pathlib import Path

# Insert the project root (this file's directory) at the front of sys.path
sys.path.insert(0, str(Path(__file__).parent))
