export const environment = {
  production: true,

  // 👇 Point this ONLY to the new backend service
  apiUrl: 'https://backend-dev2-dot-flashyre-dev-473115.el.r.appspot.com/',
  websocketUrl: 'https://backend-dev2-dot-flashyre-dev-473115.el.r.appspot.com/',

  // You can reuse existing dev assets/buckets for now
  defaultProfilePicture: 'https://storage.googleapis.com/cflashyre-dev-b2/media/profile-placeholder.jpg',
  defaultCompanyIcon: 'https://storage.googleapis.com/cflashyre-dev-b2/media/defaultCompanyIcon.png',

  fh_logo_thumbnail: 'https://storage.googleapis.com/cflashyre-dev-b2/media/fh_logo_thumbnail.png',
  chcs_logo_thumbnail: 'https://storage.googleapis.com/cflashyre-dev-b2/media/chcs_logo_thumbnail.jfif',

  mcq_upload_template:
    'https://storage.googleapis.com/cflashyre-dev-b2/mcq_question_upload_template/flashyre_mcq_questions_template.xlsx',

  googleMapsApiKey: 'AIzaSyBX3UGCNzeikSRyRY8sS8JJZ2oeO6lj2-w',
  googleClientId: '163465767284-567fbcql8qvsfcr3hp44m7h95k67o720.apps.googleusercontent.com',
};
