# TODO: Deploy DMF Application to Render

## Database Migration
- [x] Install PostgreSQL client library (pg)
- [x] Update webhook-server.js to use PostgreSQL instead of SQLite3
- [x] Create database schema for webhook_data table in PostgreSQL
- [ ] Update .env with PostgreSQL connection details

## Render Configuration
- [ ] Configure environment variables for production
- [ ] Confirm PostgreSQL connection for Render

## Deployment
- [ ] Test database connection locally
- [ ] Deploy to Render
- [ ] Verify webhook functionality with PostgreSQL
- [ ] Test Conta Azul API integration
- [x] Update frontend to use production URLs

## Cobli API Integration
- [x] Add Cobli payments endpoint to server.js
- [x] Add syncFromCobliAPI method to DataProcessor
- [x] Add Cobli sync button to payments UI
- [ ] Test Cobli API integration
- [ ] Configure Cobli API credentials in environment

## Conta Azul API Fixes
- [x] Add POST /api/payments/:id/sign endpoint (gestor/admin role)
- [x] Add DELETE /api/payments/:id endpoint (admin role)
- [x] Implement token refresh for API calls
- [x] Add detailed logging for payment operations
- [x] Ensure 10-second timeout for Conta Azul API calls
- [x] Add input validation and error handling

## Post-Deployment
- [ ] Configure domain (if needed)
- [ ] Set up monitoring and logging
- [ ] Test all endpoints
