#!/bin/bash
# ============================================================
# FAMILIA - Create Demo Users Script
# Run this script to create 12 demo users for testing
# ============================================================

API_URL="http://localhost:8000/api/v1"

echo "🚀 Creating demo users for Familia..."
echo ""

# Array of users: email, username, display_name, country, role_description
declare -a USERS=(
    "test1@gmail.com|kiran|Kiran Kumar|India|Mother - A nurturing soul"
    "test2@gmail.com|swapna|Swapna Reddy|India|Father - A guiding presence"
    "test3@gmail.com|arjun|Arjun Sharma|India|Son - An eager learner"
    "test4@gmail.com|priya|Priya Patel|India|Daughter - A curious explorer"
    "test5@gmail.com|rahul|Rahul Verma|India|Sibling - A companion"
    "test6@gmail.com|anita|Anita Gupta|India|Grandparent - Wisdom giver"
    "test7@gmail.com|vikram|Vikram Singh|India|Grandchild - Youth bridging"
    "test8@gmail.com|meera|Meera Nair|India|Mentor - A cultural guide"
    "test9@gmail.com|aditya|Aditya Joshi|India|Student - Ready to learn"
    "test10@gmail.com|kavya|Kavya Iyer|India|Friend - Cross-cultural bond"
    "test11@gmail.com|rohan|Rohan Desai|India|Pen Pal - Letter writer"
    "test12@gmail.com|anjali|Anjali Menon|India|Explorer - Adventure seeker"
)

# Create each user
for i in "${!USERS[@]}"; do
    IFS='|' read -r email username display_name country role <<< "${USERS[$i]}"
    password_num=$((i + 1))
    password="password${password_num}"
    
    echo "Creating user $((i + 1))/12: $display_name ($email)..."
    
    response=$(curl -s -X POST "${API_URL}/auth/signup" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"${email}\",
            \"password\": \"${password}\",
            \"username\": \"${username}\",
            \"display_name\": \"${display_name}\",
            \"date_of_birth\": \"199$((i % 9 + 1))-0$((i % 9 + 1))-1$((i % 9 + 1))\",
            \"country\": \"${country}\",
            \"timezone\": \"Asia/Kolkata\"
        }")
    
    if echo "$response" | grep -q "access_token"; then
        echo "  ✅ Success: $display_name created"
    else
        echo "  ❌ Error: $response"
    fi
done

echo ""
echo "============================================================"
echo "📋 DEMO USER CREDENTIALS"
echo "============================================================"
echo ""
echo "| Email              | Name         | Password    | Role        |"
echo "|--------------------|--------------| ------------|-------------|"
echo "| test1@gmail.com    | Kiran Kumar  | password1   | Mother      |"
echo "| test2@gmail.com    | Swapna Reddy | password2   | Father      |"
echo "| test3@gmail.com    | Arjun Sharma | password3   | Son         |"
echo "| test4@gmail.com    | Priya Patel  | password4   | Daughter    |"
echo "| test5@gmail.com    | Rahul Verma  | password5   | Sibling     |"
echo "| test6@gmail.com    | Anita Gupta  | password6   | Grandparent |"
echo "| test7@gmail.com    | Vikram Singh | password7   | Grandchild  |"
echo "| test8@gmail.com    | Meera Nair   | password8   | Mentor      |"
echo "| test9@gmail.com    | Aditya Joshi | password9   | Student     |"
echo "| test10@gmail.com   | Kavya Iyer   | password10  | Friend      |"
echo "| test11@gmail.com   | Rohan Desai  | password11  | Pen Pal     |"
echo "| test12@gmail.com   | Anjali Menon | password12  | Explorer    |"
echo ""
echo "✅ Demo users created! You can now login with any of these accounts."
