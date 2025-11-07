# Implementation Plan

- [ ] 1. Create Google logo SVG asset file
  - Create a google-logo.svg file in the src/assets directory
  - Include the official Google "G" logo design with proper colors (blue, red, yellow, green)
  - Ensure the SVG is optimized and sized appropriately for 20x20px rendering
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 2. Refactor signup page Google Sign-In implementation
  - [ ] 2.1 Update signup-candidate1.component.ts to subscribe to authState
    - Remove the `signUpWithGoogle()` method
    - In `ngOnInit()`, subscribe to `socialAuthService.authState` observable
    - Move authentication logic from `signUpWithGoogle()` to the authState subscription
    - Handle user type selection and phone popup flow in the subscription
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [ ] 2.2 Update signup-candidate1.component.html button implementation
    - Replace custom button with `<asl-google-signin-button>` component
    - Remove `(click)="signUpWithGoogle()"` event handler
    - Apply custom CSS classes to match existing design
    - Keep the separator and positioning
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 4.1_

- [ ] 3. Refactor login page Google Sign-In implementation
  - [ ] 3.1 Update log-in-page.component.ts to subscribe to authState
    - Remove the `signInWithGoogle()` method
    - In `ngOnInit()`, subscribe to `socialAuthService.authState` observable
    - Move authentication logic from `signInWithGoogle()` to the authState subscription
    - Handle login response and emit to parent component
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [ ] 3.2 Update log-in-page.component.html button implementation
    - Replace custom button with `<asl-google-signin-button>` component
    - Remove `(click)="signInWithGoogle()"` event handler
    - Apply custom CSS classes to match existing design
    - Keep the separator and positioning
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 4.1_

- [ ] 4. Test Google Sign-In functionality
  - Navigate to sign-up page and verify button displays correctly
  - Click Google Sign-In button and verify no console errors
  - Test complete sign-up flow with Google authentication
  - Navigate to login page and verify button displays correctly
  - Click Google Sign-In button and verify authentication works
  - Verify browser console shows no errors related to Google Sign-In API
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 4.3_
