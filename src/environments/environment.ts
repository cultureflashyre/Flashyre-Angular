
// This file can be replaced during build by using the fileReplacements array.
// ng build --prod replaces environment.ts with environment.prod.ts.
// The list of file replacements can be found in angular.json.

export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/',
  websocketUrl: 'http://localhost:8000/',

  defaultProfilePicture: 'https://storage.googleapis.com/cflashyre-dev-b2/media/profile-placeholder.jpg',
  defaultCompanyIcon: 'https://storage.googleapis.com/cflashyre-dev-b2/media/defaultCompanyIcon.png',

  fh_logo_thumbnail: 'https://storage.googleapis.com/cflashyre-dev-b2/media/fh_logo_thumbnail.png',
  chcs_logo_thumbnail: 'https://storage.googleapis.com/cflashyre-dev-b2/media/chcs_logo_thumbnail.jfif',

  mcq_upload_template: 'https://storage.googleapis.com/cflashyre-dev-b2/mcq_question_upload_template/flashyre_mcq_questions_template.xlsx',
  googleMapsApiKey: 'AIzaSyBX3UGCNzeikSRyRY8sS8JJZ2oeO6lj2-w',
  googleClientId: '76855691155-qj1bb6i1fcidraejoicasbpe1hi6g283.apps.googleusercontent.com'
};

/*
  * For easier debugging in development mode, you can import the following file
  * to ignore zone related error stack frames such as zone.run, zoneDelegate.invokeTask.
  *
  * This import should be commented out in production mode because it will have a negative impact
  * on performance if an error is thrown.
  */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.




