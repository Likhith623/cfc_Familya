#!/bin/bash
# ============================================================
# FAMILIA - Update Demo Users with Roles
# Run this to add roles to existing demo user profiles
# ============================================================

API_URL="http://localhost:8000/api/v1"

echo "🔄 Updating demo user roles..."
echo ""

# First, login and get tokens for each user, then update their profiles

# User role mappings
declare -a USER_ROLES=(
    "test1@gmail.com|password1|mother"
    "test2@gmail.com|password2|father"
    "test3@gmail.com|password3|son"
    "test4@gmail.com|password4|daughter"
    "test5@gmail.com|password5|brother"
    "test6@gmail.com|password6|grandparent"
    "test7@gmail.com|password7|grandchild"
    "test8@gmail.com|password8|mentor"
    "test9@gmail.com|password9|student"
    "test10@gmail.com|password10|friend"
    "test11@gmail.com|password11|friend"
    "test12@gmail.com|password12|friend"
)

for entry in "${USER_ROLES[@]}"; do
    IFS='|' read -r email password role <<< "$entry"
    
    echo "Updating $email with role: $role..."
    
    # Login to get token
    login_response=$(curl -s -X POST "${API_URL}/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"${email}\", \"password\": \"${password}\"}")
    
    token=$(echo "$login_response" | grep -o '"access_token":"[^"]*"' | sed 's/"access_token":"//;s/"$//')
    
    if [ -z "$token" ] || [ "$token" == "null" ]; then
        echo "  ❌ Failed to login: $login_response"
        continue
    fi
    
    # Update profile with role in matching_preferences
    update_response=$(curl -s -X PUT "${API_URL}/profiles/me" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${token}" \
        -d "{
            \"matching_preferences\": {
                \"offering_role\": \"${role}\",
                \"preferred_roles\": [\"${role}\"]
            }
        }")
    
    if echo "$update_response" | grep -q "display_name"; then
        echo "  ✅ Updated $email with role: $role"
    else
        echo "  ❌ Error updating: $update_response"
    fi
done

echo ""
echo "============================================================"
echo "✅ Demo user roles updated!"
echo ""
echo "Test with: curl http://localhost:8000/api/v1/matching/browse-public/mother"
echo "============================================================"
