#!/bin/bash

# API Testing Script for Draft Server
# Run this script to test user signup, login, payment methods, and restaurants

BASE_URL="http://localhost:3000/api"

echo "Testing Draft Server API"
echo "========================"

# 1. User Signup
echo "1. User Signup: /signup"
SIGNUP_RESPONSE=$(curl -s -X POST $BASE_URL/signup \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "password": "password123"
  }')
echo "Signup Response: $SIGNUP_RESPONSE"
echo ""

# 2. User Login
echo "2. User Login: /login"
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }')
echo "Login Response: $LOGIN_RESPONSE"

# Extract token from login response (assuming JSON format: {"token":"..."})
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "Extracted Token: $TOKEN"
echo ""

# 3. Add Payment Method
echo "3. Add Payment Method: /payment-methods"
PAYMENT_RESPONSE=$(curl -s -X POST $BASE_URL/payment-methods \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "card_number": "4111111111111111",
    "card_cvc": "123",
    "card_holder_name": "John Doe",
    "card_brand": "Visa",
    "card_exp_month": 12,
    "card_exp_year": 2025,
    "billing_address": {
      "street": "123 Main St",
      "city": "Anytown",
      "state": "CA",
      "zip": "12345"
    },
    "is_default": true
  }')
echo "Add Payment Method Response: $PAYMENT_RESPONSE"

# Extract payment method ID (assuming response has "id":1)
PAYMENT_ID=$(echo $PAYMENT_RESPONSE | grep -o '"id":[0-9]*' | cut -d':' -f2)
echo "Payment Method ID: $PAYMENT_ID"
echo ""

# 4. Edit Payment Method
echo "4. Edit Payment Method: /payment-methods/$PAYMENT_ID"
EDIT_RESPONSE=$(curl -s -X PUT $BASE_URL/payment-methods/$PAYMENT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "card_holder_name": "John Q. Doe",
    "billing_address": {
      "street": "456 Oak Ave",
      "city": "Newtown",
      "state": "NY",
      "zip": "67890"
    }
  }')
echo "Edit Payment Method Response: $EDIT_RESPONSE"
echo ""

# 5. Get Restaurants
echo "5. Get Restaurants: /restaurants"
RESTAURANTS_RESPONSE=$(curl -s $BASE_URL/restaurants)
echo "Restaurants Response: $RESTAURANTS_RESPONSE"

# Extract first restaurant ID (assuming response has [{"id":1,...}])
RESTAURANT_ID=$(echo $RESTAURANTS_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "First Restaurant ID: $RESTAURANT_ID"
echo ""

# 6. Get Menu for Restaurant
echo "6. Get Menu: /restaurants/$RESTAURANT_ID/menu"
MENU_RESPONSE=$(curl -s $BASE_URL/restaurants/$RESTAURANT_ID/menu)
echo "Menu Response: $MENU_RESPONSE"

# Extract first menu item ID
MENU_ITEM_ID=$(echo $MENU_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "First Menu Item ID: $MENU_ITEM_ID"
echo ""

# 7. Create Tab
echo "7. Create Tab: /tabs"
TAB_RESPONSE=$(curl -s -X POST $BASE_URL/tabs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"restaurant_id": '$RESTAURANT_ID'}')
echo "Create Tab Response: $TAB_RESPONSE"

# Extract tab ID
TAB_ID=$(echo $TAB_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "Tab ID: $TAB_ID"
echo ""

# 8. Add Item to Tab
echo "8. Add Item to Tab: /tabs/$TAB_ID/items"
ADD_ITEM_RESPONSE=$(curl -s -X POST $BASE_URL/tabs/$TAB_ID/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"menu_item_id": '$MENU_ITEM_ID', "quantity": 2}')
echo "Add Item Response: $ADD_ITEM_RESPONSE"
echo ""

# 9. Close Tab
echo "9. Close Tab: /tabs/$TAB_ID/close"
CLOSE_TAB_RESPONSE=$(curl -s -X PUT $BASE_URL/tabs/$TAB_ID/close \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"payment_method_id": '$PAYMENT_ID'}')
echo "Close Tab Response: $CLOSE_TAB_RESPONSE"
echo ""

echo "API Testing Complete"
