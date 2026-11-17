# Hackathon submission draft

## Solution summary

no-fat-no-fat is a multilingual wellness prototype for adults who understand healthy intentions but struggle to sustain them through inconsistent schedules, procrastination, and recurring barriers. UNFIT AI uses memorable sarcasm as an engagement layer, then converts conversation into small practical actions. Its core loop is Roast → Investigate → Action → Track → Remember. Users create a browser-local profile, choose tone and schedule preferences, talk to Gemini through a secure proxy, open contextual tools, confirm completed missions, earn non-punitive XP, and review evidence based on real local activity. The product avoids body shaming, dangerous dieting, and medical claims. Its innovation is not the joke alone: conversation, barrier recognition, action selection, confirmation, analytics, and future context form one coherent behaviour-support loop. Intended value should be evaluated through action acceptance, completion, return-after-interruption, usefulness, and tone satisfaction—not unsupported clinical outcomes.

## Solution stage

**Functional hackathon prototype.** Core flows and local persistence are implemented; broader localisation, live deployment validation, user research, and clinical review remain future work.

## What has been built

A responsive React application with maximalist landing and onboarding experiences, optional adult BMI screening information, browser-local profiles, daily missions, idempotent XP and achievements, progress analytics, profile/settings/data controls, and six health tools. Gemini chat uses a server-side Interactions API proxy with trusted safety instructions, stateless requests, validated context, and allowlisted tool-action cards. Movement Roulette includes a timestamp timer and confirmation-based rewards. Evidence Lab derives results from stored mission and tool records. Export, validated import, memory control, progress reset, and app-only deletion are included. Automated tests cover critical business and persistence rules.

## Technology type

- Software application
- Conversational AI agent prototype
- Behavioural activity analytics

## Links and declarations

- Prototype link: **add only after verified deployment**
- Demo video link: **add only after upload and access check**
- Solution deck: the official template was not found; prepare a proposed outline only after obtaining it, then export under 5 MB.
- Conflict of interest: **team members must confirm this declaration**
- Classification: software-only wellness prototype; no custom hardware

