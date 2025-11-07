# Design Document

## Overview

This design addresses two issues preventing the Google sign-in buttons from working correctly: (1) the missing Google logo asset, and (2) the incorrect implementation of the Google Sign-In flow. The solution involves adding the Google logo SVG file and refactoring the button implementation to use the proper `<asl-google-signin-button>` component from the @abacritt/angularx-social-login library instead of manually calling the sign-in method.

## Architecture

The fix is purely asset-based and requires no architectural changes. The existing components already reference the Google logo at `/assets/google-logo.svg`, but this file is currently missing.

### Current State
- HTML templates contain custom Google sign-in button markup
- CSS styling is properly configured for the buttons
- TypeScript methods incorrectly call `socialAuthService.signIn()` directly
- Google logo SVG file is missing from `src/assets/`
- Console errors indicate improper use of the Google Sign-In API

### Target State
- Google logo SVG file exists at `src/assets/google-logo.svg`
- Buttons use `<asl-google-signin-button>` component or proper Google API
- Authentication flow works without console errors
- Components subscribe to SocialAuthService state changes

## Components and Interfaces

### Affected Components

1. **signup-candidate1.component.html**
   - Already contains: `<img src="/assets/google-logo.svg" alt="Google logo" />`
   - No changes needed

2. **log-in-page.component.html**
   - Already contains: `<img src="/assets/google-logo.svg" alt="Google logo" />`
   - No changes needed

3. **Assets Directory**
   - Location: `src/assets/`
   - New file: `google-logo.svg`

## Data Models

No data model changes required. This is a static asset addition.

## Error Handling

### Current Issue
- Missing asset causes broken image icon or invisible button
- Browser console may show 404 error for missing SVG

### Resolution
- Adding the SVG file will resolve the 404 error
- Buttons will render properly with the logo visible

## Testing Strategy

### Manual Testing
1. Add the Google logo SVG to `src/assets/`
2. Navigate to the sign-up page (`/signup-candidate`)
3. Verify the "Sign up with Google" button is visible with the Google logo
4. Navigate to the login page (`/login-candidate`)
5. Verify the "Sign in with Google" button is visible with the Google logo
6. Check browser console for any 404 errors (should be none)

### Visual Verification
- Button should display with:
  - White background
  - Gray border
  - Google "G" logo on the left (20x20px)
  - Text "Sign up with Google" or "Sign in with Google"
  - Proper spacing and alignment

### Browser Compatibility
- Test in Chrome, Firefox, Edge, Safari
- Verify SVG renders correctly across browsers

## Implementation Notes

### Google Logo SVG
The SVG should contain the official Google "G" logo. The recommended approach is to use the official Google brand assets or create an SVG with the following characteristics:
- Dimensions: 20x20 pixels (as specified in CSS)
- Colors: Google's official brand colors (blue, red, yellow, green)
- Format: Clean, optimized SVG code
- Accessibility: Include proper title/desc tags if needed

### File Location
- Path: `src/assets/google-logo.svg`
- Referenced in HTML as: `/assets/google-logo.svg`
- Angular serves assets from the `src/assets/` directory at the `/assets/` URL path

### Implementation Approach

There are two valid approaches to fix the Google Sign-In implementation:

#### Option 1: Use `<asl-google-signin-button>` Component (Recommended)
Replace the custom button with the library's built-in component:
```html
<asl-google-signin-button type="standard" size="large"></asl-google-signin-button>
```
- Pros: Handles authentication automatically, no manual method calls
- Cons: Less control over button styling

#### Option 2: Use Google's `renderButton()` API
Keep custom button but initialize it properly:
```typescript
google.accounts.id.renderButton(
  document.getElementById("custom-google-button"),
  { theme: "outline", size: "large" }
);
```
- Pros: More styling control
- Cons: Requires additional setup and Google API script loading

#### Recommended Solution
Use Option 1 with custom CSS to match the existing design. Subscribe to `SocialAuthService.authState` observable to handle authentication responses instead of calling `signIn()` directly from click handlers.

### Code Changes Required

1. **signup-candidate1.component.html**
   - Replace custom button with `<asl-google-signin-button>` or properly initialized button
   - Remove `(click)="signUpWithGoogle()"` handler

2. **log-in-page.component.html**
   - Replace custom button with `<asl-google-signin-button>` or properly initialized button
   - Remove `(click)="signInWithGoogle()"` handler

3. **signup-candidate1.component.ts**
   - Remove `signUpWithGoogle()` method
   - Subscribe to `socialAuthService.authState` in `ngOnInit()`
   - Handle authentication response in the subscription

4. **log-in-page.component.ts**
   - Remove `signInWithGoogle()` method
   - Subscribe to `socialAuthService.authState` in `ngOnInit()`
   - Handle authentication response in the subscription
