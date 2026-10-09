# Lumina Backend - Postman Testing Documentation

This document tests the rebuilt backend from a clean installation.

Start the API:

```bash
npm run dev
```

Base URL:

```text
http://localhost:5000/api
```

## 1. Create a Postman environment

Create an environment named `Lumina Local`:

| Variable            | Value                       |
|---------------------|-----------------------------|
| `baseUrl`           | `http://localhost:5000/api` |
| `customerToken`     | empty                       |
| `sellerToken`       | empty                       |
| `adminToken`        | empty                       |
| `userId`            | empty                       |
| `sellerId`          | empty                       |
| `productId`         | empty                       |
| `categoryId`        | empty                       |
| `orderId`           | empty                       |
| `addressId`         | empty                       |
| `resetToken`        | empty                       |
| `verificationToken` | empty                       |

Select this environment before testing.

## 2. Health check

```http
GET {{baseUrl}}/health
```

Expected:

```json
{
  "ok": true,
  "service": "lumina-backend"
}
```

## 3. Authentication tests

### 3.1 Customer registration

```http
POST {{baseUrl}}/auth/register
Content-Type: application/json
```

```json
{
  "name": "Postman Customer",
  "email": "postman.customer@example.com",
  "password": "Customer@12345",
  "phone": "+94771234567"
}
```

Save the returned token as `customerToken`.

### 3.2 Seller registration

```http
POST {{baseUrl}}/auth/register-seller
Content-Type: application/json
```

```json
{
  "name": "Postman Seller",
  "email": "postman.seller@example.com",
  "password": "Seller@12345",
  "phone": "+94771234568",
  "storeName": "Postman Store",
  "businessAddress": "Colombo, Sri Lanka",
  "description": "A demo seller application"
}
```

Expected result:

```json
{
  "status": "Pending"
}
```

A new seller cannot access seller routes until approved by an administrator.

### 3.3 Customer login

```http
POST {{baseUrl}}/auth/login
Content-Type: application/json
```

```json
{
  "email": "john.doe@example.com",
  "password": "Lumina@2026"
}
```

Tests:

```javascript
const body = pm.response.json();
pm.test("Login succeeded", () => pm.response.to.have.status(200));
pm.environment.set("customerToken", body.token);
```

Save the returned token as `adminToken`.

### 3.4 Current user

```http
GET {{baseUrl}}/auth/me
Authorization: Bearer {{customerToken}}
```

### 3.5 Email verification

Copy the verification token from the email and save it as `verificationToken`.

```http
GET {{baseUrl}}/auth/verify-email?token={{verificationToken}}
```

Expected:

```json
{
  "message": "Email verified successfully"
}
```

### 3.6 Forgot password

```http
POST {{baseUrl}}/auth/forgot-password
Content-Type: application/json
```

```json
{
  "email": "john.doe@example.com"
}
```

Copy the token from the email and save it as `resetToken`.

### 3.7 Reset password

```http
POST {{baseUrl}}/auth/reset-password
Content-Type: application/json
```

```json
{
  "token": "{{resetToken}}",
  "password": "NewPassword@12345"
}
```

## 4. Customer profile and addresses

All requests below require:

```http
Authorization: Bearer {{customerToken}}
```

### 4.1 Get profile

```http
GET {{baseUrl}}/auth/me
```

### 4.2 Update profile

```http
PATCH {{baseUrl}}/account/profile
Content-Type: application/json
```

```json
{
  "name": "Updated Customer",
  "phone": "+94770000000"
}
```

### 4.3 List addresses

```http
GET {{baseUrl}}/account/addresses
```

### 4.4 Add address

```http
POST {{baseUrl}}/account/addresses
Content-Type: application/json
```

```json
{
  "label": "Home",
  "fullName": "John Doe",
  "phone": "+94771234567",
  "address": "123 Main Street",
  "city": "Colombo",
  "district": "Colombo",
  "postalCode": "00300",
  "isDefault": true
}
```

Save the returned `_id` as `addressId`.

### 4.5 Update address

```http
PATCH {{baseUrl}}/account/addresses/{{addressId}}
Content-Type: application/json
```

```json
{
  "city": "Negombo",
  "isDefault": true
}
```

### 4.6 Delete address

```http
DELETE {{baseUrl}}/account/addresses/{{addressId}}
```

### 4.7 Change password

```http
POST {{baseUrl}}/account/change-password
Content-Type: application/json
```

```json
{
  "currentPassword": "Lumina@2026",
  "newPassword": "NewPassword@12345"
}
```

## 5. Categories & Products

### 5.1 List categories

```http
GET {{baseUrl}}/categories
```

### 5.2 List products

```http
GET {{baseUrl}}/products?page=1&perPage=12&sort=newest
```

Support query parameters:
```
search
category
min
max
availability=all|in|out
sort=newest|price-asc|price-desc|rating|popular
page
perPage
sellerId
```

### 5.3 Get product details

```http
GET {{baseUrl}}/products/{{productId}}
```

# 6. Orders and Checkout

### 6.1 Place COD order

```http
POST {{baseUrl}}/orders
Authorization: Bearer {{customerToken}}
Content-Type: application/json
```

```json
{
  "items": [
    {
      "productId": "{{productId}}",
      "qty": 2
    }
  ],
  "deliveryAddress": {
    "fullName": "John Doe",
    "phone": "+94771234567",
    "address": "123 Main Street",
    "city": "Colombo",
    "district": "Colombo",
    "postalCode": "00300"
  },
  "deliveryFee": 450,
  "paymentMethod": "COD"
}
```

### 6.2 Customer order history

```http
GET {{baseUrl}}/orders/mine
Authorization: Bearer {{customerToken}}
```

### 6.3 Cancel order

```http
PATCH {{baseUrl}}/orders/{{orderId}}/cancel
Authorization: Bearer {{customerToken}}
```

```json
{
  "reason": "Customer changed their mind"
}
```
