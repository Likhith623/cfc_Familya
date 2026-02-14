#!/bin/bash
# ============================================================
# FAMILIA - Set Demo User Roles
# This script sets roles for existing demo users
# ============================================================

API_URL="http://localhost:8000/api/v1"

echo "🔄 Setting roles for demo users..."
echo ""

# User role mappings: email|password|offering_role|seeking_role
declare -a USER_ROLES=(
    "test1@gmail.com|password1|mother|son"
    "test2@gmail.com|password2|father|daughter"
    "test3@gmail.com|password3|son|mother"
    "test4@gmail.com|password4|daughter|father"
    "test5@gmail.com|password5|brother|sister"
    "test6@gmail.com|password6|grandparent|grandchild"
    "test7@gmail.com|password7|grandchild|grandparent"
    "test8@gmail.com|password8|mentor|student"
    "test9@gmail.com|password9|student|mentor"
    "test10@gmail.com|password10|friend|friend"
    "test11@gmail.com|password11|friend|friend"
    "test12@gmail.com|password12|friend|friend"
)

success_count=0
fail_count=0

for entry in "${USER_ROLES[@]}"; do
    IFS='|' read -r email password offering_role seeking_role <<< "$entry"
    
    echo "📝 Setting role for $email: $offering_role (seeking: $seeking_role)..."
    
    # Login to get token
    login_response=$(curl -s -X POST "${API_URL}/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"${email}\", \"password\": \"${password}\"}")
    
    token=$(echo "$login_response" | grep -o '"access_token":"[^"]*"' | sed 's/"access_token":"//;s/"$//')
    
    if [ -z "$token" ] || [ "$token" == "null" ]; then
        echo "  ❌ Failed to login: $email"
        ((fail_count++))
        continue
    fi
    
    # Set role using the new endpoint
    role_response=$(curl -s -X POST "${API_URL}/profiles/me/role" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${token}" \
        -d "{\"offering_role\": \"${offering_role}\", \"seeking_role\": \"${seeking_role}\"}")
    
    if echo "$role_response" | grep -q '"success":true'; then
        echo "  ✅ Success: $email is now a '$offering_role'"
        ((success_count++))
    else
        echo "  ❌ Error: $role_response"
        ((fail_count++))
    fi
done

echo ""
echo "============================================================"
echo "📊 RESULTS: $success_count succeeded, $fail_count failed"
echo "============================================================"
echo ""
echo "🧪 Testing browse endpoints..."
echo ""

for role in mother father son daughter mentor student grandparent grandchild friend brother; do
    result=$(curl -s "http://localhost:8000/api/v1/matching/browse/$role" 2>/dev/null)
    count=$(echo "$result" | grep -o '"count":[0-9]*' | sed 's/"count"://')
    names=$(echo "$result" | grep -o '"display_name":"[^"]*"' | sed 's/"display_name":"//g;s/"//g' | tr '\n' ', ' | sed 's/,$//')
    echo "  $role: $count users${names:+ - }$names"
done

echo ""
echo "✅ Done! Test with: curl http://localhost:8000/api/v1/matching/browse/mother"
