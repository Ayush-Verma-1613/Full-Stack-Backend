# DevTinder APIs

## authRouter
- POST /signup
- POSTlogin
- POST/logout


## profileRouter
- GET /profile/view
- PATCH /profile/edit
- PATCH /profile/password  //Change password API

## connnectionRequestRouter
- POST /request/send/:status/:userId
- POST /request/review/:status/:requestId

## userRouter
- GET /user/connections
- GET /user/requests
- GET /user/feed - Gets you the profiles of other users on platform