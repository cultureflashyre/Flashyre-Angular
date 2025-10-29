

Local (uses environment.ts)	
ng serve or ng build	The default configuration. No extra flag is needed.


Development (uses environment.dev.ts)
ng serve --configuration=development or ng build --configuration=development

Testing (uses environment.testing.ts)
ng serve --configuration=testing or ng build --configuration=testing

Production (uses environment.prod.ts)	
ng serve --configuration=production or ng build --configuration=production	
The production alias is typically set up by default in angular.json.


Staging (uses environment.staging.ts)	
ng serve --configuration=staging or ng build --configuration=staging	
Requires you to define the staging configuration in angular.json.

---------------------------------------------------------------
---------------------------------------------------------------
After you have built the application based on the environment,
run the following script deploy.sh, using the appropriate backend 
URL, to create the correct app.yaml file in the required folder. 
---------------------------------------------------------------
---------------------------------------------------------------
Run the deployment script with the correct environment variable:

For Production
BACKEND_URL="https://your-production-api.appspot.com" ./deploy.sh

For Staging
BACKEND_URL="https://your-staging-api.appspot.com" ./deploy.sh