

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