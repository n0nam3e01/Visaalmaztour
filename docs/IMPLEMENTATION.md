# Visa Almaz Tour — brief and implementation plan
Approved in conversation 2026-10-22. User explicitly prefers evolving design during implementation.
Goal: independent responsive information and consultation website, preserving Almaz Tour identity.
Architecture: static HTML/CSS/ES modules, zero runtime dependencies, Node preview/build helpers.
Source: https://www.instagram.com/visa.almaztour.kz/ viewed through user's Chrome.
Verified: USA, Schengen, Japan; DS-160 support, document preparation, repeat applications.
Address: Astana, Kabanbay Batyr 6/1, Kaskad, floor 5, office 51/5.
Phones: +77064060101 and +77018887932. Both confirmed by user.
Do not invent prices, hours, testimonials or approval guarantees.
Google Maps: usable embed fallback; optional official JS API with Places lookup of the verified address, using configured public restricted key.
- [x] Implement and test contact message encoding and optional map URL generation.
- [x] Build visual page: navigation, hero, destinations, services, process, sourced cases, FAQ, contacts.
- [x] Connect destination dialog, WhatsApp consultation, mobile navigation, map fallback/API.
- [x] Verify tests, build, HTTP, browser desktop/mobile and keyboard.
Review focus: blank inputs, non-Latin text, mobile overflow, missing map key, dialog keyboard dismissal.
No public deployment or push requested. Associate local repository with supplied GitHub remote.

WhatsApp extension: official Cloud API sender +77064060101; recipient is a separately configured manager number. Secrets absent; live delivery is not verified. 15 tests pass, syntax check and build pass. Desktop 1440 and mobile 390/320 checked; map iframe, country dialog, quick-select, WhatsApp fallback checked. Review found malformed URL handling; fixed with a failing-then-passing regression. Also fixed split UTF-8 decoding. Initial select markup repaired and verified in browser. No push or public deployment.
