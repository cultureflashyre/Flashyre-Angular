# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: notifications-persistent-alert.spec.ts >> Persistent Notification Alerts & Idle Heartbeat Workflow >> Scenario 5: Idle tab title flashes action notice and restores on notification bell click
- Location: e2e\notifications-persistent-alert.spec.ts:162:7

# Error details

```
Error: Expected document title to flash action notice for idle user

Expected document title to flash action notice for idle user

expect(received).toContain(expected) // indexOf

Expected substring: "Action Required!"
Received string:    "Login - Flashyre"

Call Log:
- Timeout 10000ms exceeded while waiting on the predicate
```

# Page snapshot

```yaml
- generic [ref=e5]:
  - banner [ref=e7]:
    - img "image" [ref=e9]
  - generic [ref=e12]:
    - heading "Welcome to Flashyre" [level=1] [ref=e13]
    - generic [ref=e16]:
      - generic [ref=e17]:
        - generic [ref=e19]:
          - generic [ref=e20]: Email
          - textbox "Enter your email" [ref=e23]
        - generic [ref=e25]:
          - generic [ref=e26]: Password
          - textbox "Enter Password" [ref=e29]
          - generic [ref=e30]: Show
        - generic [ref=e32]:
          - generic [ref=e33]:
            - generic [ref=e34]:
              - generic [ref=e35]: "Security Check:"
              - generic [ref=e36]: Error loading challenge
            - button "Refresh challenge" [ref=e37] [cursor=pointer]
          - textbox "Answer" [ref=e41]
        - button "Login" [disabled] [ref=e42]
      - generic [ref=e46]:
        - generic [ref=e47]: OR
        - generic [ref=e49]:
          - button "Sign in with Google. Opens in new tab" [ref=e51] [cursor=pointer]:
            - generic [ref=e53]: Sign in with Google
          - iframe
      - generic [ref=e63]:
        - generic [ref=e64]: Don’t have an account?
        - generic [ref=e67]: Sign up
      - generic [ref=e70]: Forgot Password
```

# Test source

```ts
  70  |   });
  71  | 
  72  |   test('Scenario 2: Clicking Notification Bell dismisses toast and top bar and saves to localStorage', async ({ page }) => {
  73  |     await page.goto('/recruiter-workflow-candidate');
  74  | 
  75  |     const toastAlert = page.locator('app-toast-notification .toast-card');
  76  |     const superAdminBar = page.locator('app-global-notification-bar .superadmin-bar');
  77  |     await expect(toastAlert).toBeVisible();
  78  |     await expect(superAdminBar).toBeVisible();
  79  | 
  80  |     // Click Notification Bell button to acknowledge
  81  |     const bellButton = page.locator('app-notification-bell .notification-bell-btn');
  82  |     await bellButton.click();
  83  | 
  84  |     // Both the toast and the top alert bar should immediately disappear
  85  |     await expect(toastAlert).not.toBeVisible();
  86  |     await expect(superAdminBar).not.toBeVisible();
  87  | 
  88  |     // Verify localStorage has recorded the acknowledged request ID
  89  |     const storedAcknowledgedId = await page.evaluate(() => {
  90  |       return localStorage.getItem('flashyre_last_acknowledged_pending_request_id');
  91  |     });
  92  |     expect(storedAcknowledgedId).toBe(mockPendingRequestId);
  93  |   });
  94  | 
  95  |   test('Scenario 3: Reloading page keeps alerts suppressed but maintains badge counter', async ({ page }) => {
  96  |     // Pre-seed acknowledged state in localStorage
  97  |     await page.addInitScript((reqId) => {
  98  |       localStorage.setItem('flashyre_last_acknowledged_pending_request_id', reqId);
  99  |     }, mockPendingRequestId);
  100 | 
  101 |     await page.goto('/recruiter-workflow-candidate');
  102 | 
  103 |     // Top banner and toast must NOT appear on page reload
  104 |     const toastAlert = page.locator('app-toast-notification .toast-card');
  105 |     const superAdminBar = page.locator('app-global-notification-bar .superadmin-bar');
  106 |     await expect(toastAlert).not.toBeVisible();
  107 |     await expect(superAdminBar).not.toBeVisible();
  108 | 
  109 |     // Bell badge must still display 1 for situational reference
  110 |     const bellBadge = page.locator('app-notification-bell .badge-count');
  111 |     await expect(bellBadge).toBeVisible();
  112 |     await expect(bellBadge).toHaveText('1');
  113 |   });
  114 | 
  115 |   test('Scenario 4: New request arrival triggers alert again for idle user', async ({ page }) => {
  116 |     // Pre-seed acknowledged state for older request
  117 |     await page.addInitScript((reqId) => {
  118 |       localStorage.setItem('flashyre_last_acknowledged_pending_request_id', reqId);
  119 |     }, mockPendingRequestId);
  120 | 
  121 |     await page.goto('/recruiter-workflow-candidate');
  122 | 
  123 |     // Initially suppressed
  124 |     const superAdminBar = page.locator('app-global-notification-bar .superadmin-bar');
  125 |     await expect(superAdminBar).not.toBeVisible();
  126 | 
  127 |     // Simulate new request arriving via polling endpoint
  128 |     await page.route('**/api/bulk-import/report/approval-requests/?status=PENDING*', async (route) => {
  129 |       await route.fulfill({
  130 |         status: 200,
  131 |         contentType: 'application/json',
  132 |         body: JSON.stringify({
  133 |           count: 2,
  134 |           next: null,
  135 |           previous: null,
  136 |           results: [
  137 |             {
  138 |               id: mockNewPendingRequestId,
  139 |               requested_by_name: 'Bob Recruiter',
  140 |               candidate_count: 120,
  141 |               status: 'PENDING',
  142 |               created_at: new Date().toISOString(),
  143 |             },
  144 |           ],
  145 |         }),
  146 |       });
  147 |     });
  148 | 
  149 |     // Manually trigger polling refresh via window or wait for heartbeat
  150 |     await page.evaluate(() => {
  151 |       // Dispatch visibilitychange or let service heartbeat run
  152 |       document.dispatchEvent(new Event('visibilitychange'));
  153 |     });
  154 | 
  155 |     // Verify new alert appears automatically
  156 |     await expect(superAdminBar).toBeVisible({ timeout: 15000 });
  157 |     const toastAlert = page.locator('app-toast-notification .toast-card');
  158 |     await expect(toastAlert).toBeVisible();
  159 |     await expect(toastAlert).toContainText('New Report Approval Request');
  160 |   });
  161 | 
  162 |   test('Scenario 5: Idle tab title flashes action notice and restores on notification bell click', async ({ page }) => {
  163 |     await page.goto('/recruiter-workflow-candidate');
  164 | 
  165 |     // Verify tab title begins flashing to alert idle/background user
  166 |     await expect.poll(async () => await page.title(), {
  167 |       message: 'Expected document title to flash action notice for idle user',
  168 |       timeout: 10000,
  169 |       intervals: [1000, 1500],
> 170 |     }).toContain('Action Required!');
      |        ^ Error: Expected document title to flash action notice for idle user
  171 | 
  172 |     // Click Notification Bell button to acknowledge
  173 |     const bellButton = page.locator('app-notification-bell .notification-bell-btn');
  174 |     await bellButton.click();
  175 | 
  176 |     // Verify title stops flashing and restores normal title
  177 |     await expect.poll(async () => await page.title(), {
  178 |       message: 'Expected document title to restore original title after bell click',
  179 |       timeout: 5000,
  180 |     }).not.toContain('Action Required!');
  181 |   });
  182 | 
  183 |   test('Scenario 6: Recruiter idle state receives approved report persistent alert and bell dismissal', async ({ page, context }) => {
  184 |     // Switch to Recruiter user
  185 |     await context.addInitScript(() => {
  186 |       localStorage.setItem('isSuperUser', 'false');
  187 |       localStorage.setItem('userType', 'recruiter');
  188 |       localStorage.setItem('userId', '42');
  189 |       localStorage.setItem('user_id', '42');
  190 |     });
  191 | 
  192 |     const mockApprovedReqId = 'req-approved-uuid-999';
  193 | 
  194 |     // Mock recruiter's my-requests endpoint
  195 |     await page.route('**/api/bulk-import/report/approval-requests/my-requests/*', async (route) => {
  196 |       await route.fulfill({
  197 |         status: 200,
  198 |         contentType: 'application/json',
  199 |         body: JSON.stringify([
  200 |           {
  201 |             id: mockApprovedReqId,
  202 |             status: 'APPROVED',
  203 |             reviewed_by_name: 'Super Admin Jane',
  204 |             created_at: new Date().toISOString(),
  205 |             report_params: { format: 'xlsx' }
  206 |           }
  207 |         ]),
  208 |       });
  209 |     });
  210 | 
  211 |     await page.goto('/recruiter-workflow-candidate');
  212 | 
  213 |     // Recruiter receives persistent toast
  214 |     const toastAlert = page.locator('app-toast-notification .toast-card');
  215 |     await expect(toastAlert).toBeVisible({ timeout: 10000 });
  216 |     await expect(toastAlert).toContainText('Report Request Approved');
  217 | 
  218 |     // Recruiter top bar is visible
  219 |     const recruiterBar = page.locator('app-global-notification-bar .recruiter-bar');
  220 |     await expect(recruiterBar).toBeVisible();
  221 |     await expect(recruiterBar).toContainText('Report Approved');
  222 | 
  223 |     // Bell badge shows 1 approved report ready
  224 |     const bellBadge = page.locator('app-notification-bell .badge-count');
  225 |     await expect(bellBadge).toBeVisible();
  226 |     await expect(bellBadge).toHaveText('1');
  227 | 
  228 |     // Clicking bell dismisses alert and persists state
  229 |     const bellButton = page.locator('app-notification-bell .notification-bell-btn');
  230 |     await bellButton.click();
  231 | 
  232 |     await expect(toastAlert).not.toBeVisible();
  233 |     await expect(recruiterBar).not.toBeVisible();
  234 | 
  235 |     const storedApprovedId = await page.evaluate(() => {
  236 |       return localStorage.getItem('flashyre_last_acknowledged_approved_request_id');
  237 |     });
  238 |     expect(storedApprovedId).toBe(mockApprovedReqId);
  239 |   });
  240 | });
  241 | 
  242 | 
```