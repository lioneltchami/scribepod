#!/bin/bash
echo "Testing .env file format..."
echo ""

# Check file is readable
if [ ! -r .env ]; then
    echo "✗ Cannot read .env file"
    exit 1
fi

# Count number of configured variables
TOTAL_VARS=$(grep -c "^[A-Z_]*=" .env)
echo "✓ Found $TOTAL_VARS environment variables"

# Check no syntax errors (no spaces around =)
SYNTAX_ERRORS=$(grep -c "^[A-Z_]* =" .env)
if [ $SYNTAX_ERRORS -eq 0 ]; then
    echo "✓ No syntax errors (no spaces around =)"
else
    echo "✗ Found $SYNTAX_ERRORS syntax errors"
    exit 1
fi

# Check critical variables
echo ""
echo "Critical variables present:"
for var in API_KEY NODE_ENV REASON_SERVER_PORT WHISPER_SERVER_PORT CORS_ALLOWED_ORIGINS; do
    if grep -q "^${var}=" .env; then
        echo "  ✓ $var"
    else
        echo "  ✗ $var MISSING"
    fi
done

echo ""
echo "✓ .env file format is valid!"
