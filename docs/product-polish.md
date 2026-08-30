# Product polish and performance review

Phase 14 makes the existing learning workflows easier to use across devices and input methods without changing their underlying scoring or persistence rules.

## Experience improvements

- The application supports System, Light, and Dark color preferences. The choice is stored only in the browser, applied before the page becomes visible, and follows operating-system changes while System is selected.
- Application navigation identifies the current page with both a visible state and `aria-current`. The compact navigation remains reachable on narrow screens, while the header and navigation stay available during long workflows.
- Onboarding now explains the two-step journey, sets expectations for the diagnostic, and can detect the learner's device timezone.
- Empty datasets keep their existing task-specific next actions. Unexpected route errors now offer both an in-place retry and a safe dashboard exit, with a support reference when one exists.

## Accessibility review

- The existing skip link, semantic page headings, labeled navigation regions, keyboard focus treatment, live status messages, and minimum control sizes were retained or strengthened.
- Progress charts include text alternatives and exact numeric values. The detailed mastery table has a caption, so no information depends on shape or color alone.
- Profile validation communicates invalid state and connects descriptions and errors to their fields.
- Motion is reduced when the operating system requests it, including smooth scrolling and decorative animation.
- Theme colors continue to use the shared semantic token system so foreground, surface, focus, success, warning, and error states remain consistent.

## Performance review

- The optional realtime voice panel is now a separate client chunk. Its WebRTC, audio, and transcript interface is requested only for interviews where realtime is enabled; text-only interviews do not pay that initial JavaScript cost.
- Analytics charts are rendered as lightweight server markup and CSS, with no charting library or client hydration cost.
- The theme bootstrap is intentionally tiny and runs before first paint to prevent a light/dark flash.
- Existing Next.js font optimization and Server Component data loading remain in place.

Production build output should be reviewed again after Phase 15 hosting choices are known, because CDN caching, image policy, observability, and runtime region selection depend on the deployment target.
