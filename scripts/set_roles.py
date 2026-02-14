#!/usr/bin/env python3
"""Set roles for demo users."""
import requests

API_URL = "http://localhost:8000/api/v1"

USERS = [
    ("test1@gmail.com", "password1", "mother", "son"),
    ("test2@gmail.com", "password2", "father", "daughter"),
    ("test3@gmail.com", "password3", "son", "mother"),
    ("test4@gmail.com", "password4", "daughter", "father"),
    ("test5@gmail.com", "password5", "brother", "sister"),
    ("test6@gmail.com", "password6", "grandparent", "grandchild"),
    ("test7@gmail.com", "password7", "grandchild", "grandparent"),
    ("test8@gmail.com", "password8", "mentor", "student"),
    ("test9@gmail.com", "password9", "student", "mentor"),
    ("test10@gmail.com", "password10", "friend", "friend"),
    ("test11@gmail.com", "password11", "friend", "friend"),
    ("test12@gmail.com", "password12", "friend", "friend"),
]

print("🔄 Setting roles for demo users...")
print()

success = 0
fail = 0

for email, password, role, seek in USERS:
    # Login
    login_resp = requests.post(
        f"{API_URL}/auth/login",
        json={"email": email, "password": password}
    )
    
    if login_resp.status_code != 200:
        print(f"❌ Failed to login {email}")
        fail += 1
        continue
    
    token = login_resp.json().get("access_token")
    if not token:
        print(f"❌ No token for {email}")
        fail += 1
        continue
    
    # Set role
    role_resp = requests.post(
        f"{API_URL}/profiles/me/role",
        json={"offering_role": role, "seeking_role": seek},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    if role_resp.status_code == 200:
        print(f"✅ {email} -> {role}")
        success += 1
    else:
        print(f"❌ Failed to set role for {email}: {role_resp.text}")
        fail += 1

print()
print(f"📊 Results: {success} success, {fail} failed")
print()

# Test browse
print("🧪 Testing browse endpoints...")
for role in ["mother", "father", "son", "daughter", "mentor", "student", "grandparent", "grandchild", "brother", "friend"]:
    resp = requests.get(f"{API_URL}/matching/browse/{role}")
    if resp.status_code == 200:
        data = resp.json()
        names = [p["display_name"] for p in data["profiles"]]
        print(f"  {role}: {data['count']} users - {', '.join(names) if names else 'none'}")
    else:
        print(f"  {role}: ERROR - {resp.status_code}")

print()
print("✅ Done!")
