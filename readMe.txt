

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

Subject: Step-by-Step Resolution for Google Cloud Storage CORS Issue
Step 1: Problem Identification: We diagnosed that file downloads were failing due to a "CORS policy" error in the browser, which blocked our application from accessing files in Google Cloud Storage.
Step 2: Root Cause Analysis: The issue occurred because our application's domains (for local, dev, staging, and prod environments) were not on the Google Cloud Storage bucket's list of trusted sources.
Step 3: Creating the CORS Configuration: A cors.json file was created to define a new access rule, listing the specific URLs for all our application environments as trusted "origins."
Step 4: Applying the Configuration: The gsutil cors set cors.json gs://[your-bucket-name] command was executed to apply this new policy to our Google Cloud Storage bucket.
Step 5: Verification: Following the update, the download functionality was tested and confirmed to be fully restored and operational across all specified environments.