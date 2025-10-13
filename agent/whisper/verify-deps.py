#!/usr/bin/env python3
"""
Dependency Verification Script
Verifies all required Python packages are installed and importable
"""

import sys
from typing import Tuple, List

def test_import(module_name: str, package_name: str = None) -> Tuple[bool, str]:
    """
    Test if a module can be imported

    Args:
        module_name: Name of the module to import
        package_name: Display name (if different from module_name)

    Returns:
        Tuple of (success: bool, message: str)
    """
    display_name = package_name or module_name
    try:
        __import__(module_name)
        return True, f"[OK] {display_name}"
    except ImportError as e:
        return False, f"[FAIL] {display_name}: {str(e)}"
    except Exception as e:
        return False, f"[FAIL] {display_name}: Unexpected error - {str(e)}"

def main():
    """Run all dependency checks"""
    print("=" * 70)
    print("SCRIBEPOD WHISPER SERVER - DEPENDENCY VERIFICATION")
    print("=" * 70)
    print()

    # Define all required packages
    checks = [
        # Core Web Framework
        ("flask", "Flask"),
        ("flask_cors", "Flask-CORS"),
        ("werkzeug", "Werkzeug"),

        # Security & Rate Limiting
        ("flask_limiter", "Flask-Limiter"),
        ("dotenv", "python-dotenv"),

        # Logging
        ("pythonjsonlogger", "python-json-logger"),

        # Utilities
        ("requests", "requests"),

        # ML/AI Libraries
        ("torch", "PyTorch"),
        ("torchaudio", "TorchAudio"),
        ("transformers", "Transformers"),
        ("whisper", "OpenAI Whisper"),
        ("tiktoken", "Tiktoken"),
        ("numba", "Numba"),

        # Additional dependencies
        ("numpy", "NumPy"),
        ("more_itertools", "more-itertools"),
    ]

    results: List[Tuple[bool, str]] = []

    print("Testing package imports...")
    print("-" * 70)

    for module_name, display_name in checks:
        success, message = test_import(module_name, display_name)
        results.append((success, message))
        print(message)

    print()
    print("=" * 70)
    print("SUMMARY")
    print("=" * 70)

    passed = sum(1 for success, _ in results if success)
    failed = len(results) - passed

    print(f"Total packages tested: {len(results)}")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    print()

    if failed > 0:
        print("[FAIL] VERIFICATION FAILED")
        print()
        print("Failed imports:")
        for success, message in results:
            if not success:
                print(f"  {message}")
        sys.exit(1)
    else:
        print("[SUCCESS] ALL DEPENDENCIES VERIFIED SUCCESSFULLY!")
        print()
        print("Additional version information:")
        print("-" * 70)

        # Show versions for key packages
        try:
            import torch
            print(f"PyTorch version: {torch.__version__}")
            print(f"CUDA available: {torch.cuda.is_available()}")
            if torch.cuda.is_available():
                print(f"CUDA version: {torch.version.cuda}")
        except:
            pass

        try:
            import transformers
            print(f"Transformers version: {transformers.__version__}")
        except:
            pass

        try:
            import whisper
            print(f"Whisper version: {whisper.__version__}")
        except:
            pass

        try:
            import numpy
            print(f"NumPy version: {numpy.__version__}")
        except:
            pass

        print()
        print("=" * 70)
        print("You can now start the Whisper server!")
        print("Run: python app.py")
        print("=" * 70)

        sys.exit(0)

if __name__ == "__main__":
    main()
