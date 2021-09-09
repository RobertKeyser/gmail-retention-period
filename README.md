# Set a retention policy for emails matching a given query
This Google Apps Script manages email threads matching a query. It can either archive threads or move them to the trash.

# Setup Example

## Main Entrypoint
```js
/**
 * The main entrypoint for managing emails via the retention policy script.
 */
function cleanEmails(){

  let otp = {
    "from": ["no-reply@example.com"],
    "subject": ["Your 2FA code", "Your verification code"]
  }
  // moves threads that match the otp query to the trash after 1 day
  manageMatchingEmails(queryBuilder(otp),null,1); 
  
  let dataDog = {
    "from": "no-reply@dtdg.co" 
  }
  // moves threads that match the dataDog query to archive after 7 days and to the trash after 30 days
  manageMatchingEmails(queryBuilder(dataDog), 7, 30); 
}
```

## Scopes

Read, compose, send, and permanently delete all your email from Gmail	

## Trigger

| Function    | Event       | Deployment |
|-------------|-------------|------------|
| cleanEmails | Time-driven | Head       |

