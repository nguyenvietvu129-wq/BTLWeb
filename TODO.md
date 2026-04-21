# Login Error Fix TODO

## Plan Breakdown
1. [ ] Edit src/main/java/com/example/ShopDt/controller/AuthController.java - Add try-catch to login method for JSON error responses.
2. [ ] Edit src/main/resources/static/js/login.js - Add res.ok check before res.json() to handle 403/500 gracefully.
3. [ ] Rebuild project: mvn clean package
4. [ ] Restart/redeploy backend server.
5. [ ] Test login with valid/invalid creds.
6. [ ] Verify no more 403/JSON error, shows proper message.

## Status: Starting implementation
