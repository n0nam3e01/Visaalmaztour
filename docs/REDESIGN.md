# Brand alignment and motion, 2026-10-22
User approved evolving implementation. New instruction: completely match existing AlmazTour styling and font; humanize text; use Emil Kowalski's motion guidelines; add smooth scrolling. Follow-up: remove phone from form, collect name, open WhatsApp where client's number is visible.
Reference: local AlmazTour/src/app/globals.css, Header.tsx, SmoothScroll.tsx, Reveal.tsx, home page.
Tokens: #000942 navy, #ffcc00 gold, Segoe UI / Helvetica Neue / Arial, white and #f3f5f9 surfaces, borders #d9dfeb, 12/16/24px radii.
Layout: full-width photo hero, large bold type, overlapping consultation panel, photographic destination cards, white service cards, matching nav dock, consistent footer.
Copy: clear service descriptions; retain addresses, phones, source case links and consular decision notice. Remove generic poetic slogans.
Motion: locally vendored Lenis 1.3.27 (same version as main site); native touch scrolling; stop while dialog is open; keyboard and reduced-motion actions instant. WAAPI one-time 24px reveals and 50ms stagger. Fast 160-220ms feedback; opacity and transform only; subtle desktop hero parallax. Respect live reduced-motion preference changes.
Form: name and destination only. GET to wa.me/77064060101 with prepared text. No API call, no phone field, no claim a lead was sent. Name stays browser-local until user opens WhatsApp. Existing Cloud API infrastructure kept separately for future server use.
Skills read from original public sources, not globally installed:
- https://github.com/blader/humanizer/blob/main/SKILL.md
- https://github.com/emilkowalski/skills/blob/main/skills/emil-design-eng/SKILL.md
Plan:
1. Replace page composition, copy and style from local brand tokens.
2. Add local Lenis/motion module and connect dialogs/navigation/name-only WhatsApp flow.
3. Verify server/static assets, all existing tests, build, desktop/mobile, keyboard, reduced motion, map and message.

Verification:
- 16 Node tests pass, syntax check and production build pass.
- Browser checked at 1440px, 768px, 390px and 320px; no horizontal document overflow.
- Photographs load, header navigation and mobile menu work.
- Country dialog locks background scroll; Escape closes immediately and resumes Lenis.
- Quick country selection transfers to name-only form. Whitespace-only name is rejected.
- Native WhatsApp form contains one named field: text. No phone input or API submission.
- Source review confirmed reduced-motion and keyboard guards. OS preference emulation was not available in this browser, so reduced-motion was reviewed statically.
- Independent code review found no important issues.
