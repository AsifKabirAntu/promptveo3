import { BlogPost, BlogCategory } from '@/types/blog'

export const BLOG_CATEGORIES: BlogCategory[] = [
  {
    id: 'tutorials',
    name: 'Tutorials',
    slug: 'tutorials',
    description: 'Step-by-step guides and how-to articles',
    color: 'bg-blue-100 text-blue-800'
  },
  {
    id: 'news',
    name: 'News & Updates',
    slug: 'news',
    description: 'Latest updates and announcements',
    color: 'bg-green-100 text-green-800'
  },
  {
    id: 'tips',
    name: 'Pro Tips',
    slug: 'tips',
    description: 'Expert tips and best practices',
    color: 'bg-purple-100 text-purple-800'
  },
  {
    id: 'showcase',
    name: 'Showcase',
    slug: 'showcase',
    description: 'Featured creations and success stories',
    color: 'bg-orange-100 text-orange-800'
  }
]

export const SAMPLE_BLOG_POSTS: BlogPost[] = [
  {
    id: "1754959965256",
    title: "The Complete Meta Prompt Architecture for Professional Veo 3 Videos",
    slug: "the-complete-meta-prompt-architecture-for-professional-veo-3-videos",
    excerpt: "Build a production-grade Veo 3 workflow with a six-layer cognitive framework, a four-phase methodology, and enterprise-ready quality controls.",
    content: `# The Complete Meta Prompt Architecture for Professional Veo 3 Videos

To get **broadcast-quality** results from Veo 3 consistently, you need more than a clever prompt. You need a **meta prompt architecture**—a structured system that turns any brief into a validated, production-ready output.

---

## The 6‑Layer Cognitive Framework

1. **Identity Layer** — Define the AI's role and remit (e.g., "Senior Cinematographer + Dialogue Director").  
2. **Knowledge Layer** — Bake in Veo 3 capabilities, limits (≤8s), camera rules, and audio practices.  
3. **Analysis Layer** — Parse requirements: audience, platform, brand safety, success metrics.  
4. **Generation Layer** — Apply the **7‑component** Veo 3 format with consistent character blocks.  
5. **Quality Layer** — Validate negatives, audio, lighting, duration, and camera placement.  
6. **Output Layer** — Deliver the main prompt **plus** safe alternatives for A/B testing.

> Treat each layer as a checklist; don't advance until the previous one is satisfied.

---

## Systematic 4‑Phase Methodology

**Phase 1: Requirements Analysis**  
- Goal (hook, message, CTA), target platform, buyer stage, brand rules.  
- Define quality thresholds and review checkpoints.

**Phase 2: Creative Development**  
- Character template (15+ attributes), scene, camera plan, dialogue tone.  
- Align visuals with brand color, lighting, and composition rules.

**Phase 3: Technical Optimization**  
- 7‑component format, explicit camera position \`(thats where the camera is)\`.  
- Negative prompts for quality control, **≤ 8 seconds**, colon dialogue syntax.

**Phase 4: Quality Validation**  
- Audit for drift, audio hallucinations, and visual artifacts.  
- Approve or iterate; generate a "B" variant for testing.

---

## Performance & Continuous Improvement

Track these metrics across outputs:

- **Generation Success Rate** (goal: >95%)  
- **Character Consistency** (goal: >98%)  
- **Audio‑Visual Sync** (goal: >97%)  
- **Brand Compliance** (goal: 100%)  
- **User Satisfaction** (goal: >94%)

Create a lightweight log (sheet or DB) to record failures and the fix that resolved them.

---

## Advanced Techniques That Move the Needle

- **Physics‑Aware Prompting:** "realistic physics, authentic momentum, proper weight & balance."  
- **Selfie Video Formula:** arm's‑length framing, visible forearm, "slightly grainy, film‑like," brief dialogue.  
- **Dialogue Optimization:** "looks into the lens and says: '…' " (colon prevents subtitles).  
- **Audio Design:** define the room tone; forbid music/audience by default.  
- **Negative Prompts:** maintain a **universal QC list** and append project‑specific bans.

---

## Example Architecture in Action (Mini Template)

\`\`\`text
Identity: Senior Cinematographer + Dialogue Director focused on 8s social ads.
Knowledge: Veo 3 limits (≤8s, 16:9, 24fps), explicit camera placement, colon dialogue.
Analysis: TikTok top‑funnel, brand colors navy/white, CTA = "Try it free."
Generation: Apply 7‑component format with fixed character block.
Quality: Validate audio environment + negatives; confirm no subtitles/watermarks.
Output: Deliver main + variant with alternative hook framing.
\`\`\`

---

## Enterprise & Team Scalability

- **Batching & Queues:** process prompt sets for campaigns.  
- **Role‑Based Review:** copy, brand, and technical QA before publishing.  
- **Template Versioning:** track changes to character blocks and negatives.  
- **Analytics:** per‑post metrics and weekly optimization reviews.

---

## Implementation Checklist

- [ ] Six‑layer framework embedded in your prompt generator.  
- [ ] Four‑phase pipeline codified in docs or tooling.  
- [ ] 7‑component format + character template standardized.  
- [ ] Negative prompts library maintained and versioned.  
- [ ] Metrics logged with a simple success/fail dashboard.

---

## Related Reading

- [Meta Prompts for Veo 3: The Future of AI Video Creation](/insights/meta-prompts-for-veo-3-the-future-of-ai-video-creation)  
- [Mastering Character Consistency & Cinematic Quality in Veo 3](/insights/mastering-character-consistency-and-cinematic-quality-in-veo-3)

`,
          featured_image: "/blog/veo3-architecture-hero.webp",
    category: "tips",
    tags: ["veo3", "architecture", "workflow", "enterprise", "best practices"],
    published_at: "2025-08-12T00:52:45.255Z",
    updated_at: "2025-08-12T00:52:45.255Z",
    read_time: 3,
    is_featured: false
  },
  {
    id: "1754959922385",
    title: "Mastering Character Consistency & Cinematic Quality in Veo 3",
    slug: "mastering-character-consistency-cinematic-quality-in-veo-3",
    excerpt: "Lock character identity with a 15+ attribute template, control camera movement with explicit positioning, and stop audio hallucinations with environment-first prompts.",
    content: `# Mastering Character Consistency & Cinematic Quality in Veo 3

Even strong prompts can fall apart if **characters drift** or the **camera isn't grounded**. Here's how to lock identity, control motion, and keep audio realistic so your Veo 3 outputs look consistently professional.

---

## The Character Consistency Template (15+ Attributes)

Specify a complete identity block and **reuse the exact wording** across prompts.

\`\`\`text
[NAME], a 32-year-old Black British man with closely cropped coily hair, deep brown almond eyes, neat goatee, high cheekbones, medium athletic build at 178 cm, relaxed upright posture, measured hand gestures, calm confident demeanor, matte navy overshirt over sand tee, slim black watch, small silver hoop in left ear, warm baritone voice with London accent, smiles subtly when emphasizing key points.
\`\`\`

**Required coverage:** age, ethnicity, hair, eyes, facial features, height/build, posture, mannerisms, clothing (style/color/fit), accessories, emotional baseline, voice, distinctive features.

> **Rule:** Keep wording identical to achieve visual and behavioral continuity across episodes and channels.

---

## Camera Movement Mastery

Veo 3 responds best when you place the camera **explicitly**.

\`\`\`text
Style: Medium shot, camera at chest height on a 45° angle to subject (thats where the camera is), gentle 10% dolly-in, 24fps, neutral grade.
\`\`\`

**Useful moves:**

- **Dolly in/out** – Intensify focus or open context.
- **Pan/Tilt** – Reveal information cleanly.
- **Tracking** – Follow action without jump cuts.
- **Crane** – Add drama and spatial context.
- **Handheld** – Introduce energy (use sparingly to avoid shake).

---

## Preventing Audio Hallucinations

Always define the soundscape and forbid noise you don't want.

\`\`\`text
Sounds: quiet office ambiance, soft HVAC hum, no music, no crowd, broadcast-quality mic, clean studio acoustics.
Technical (Negative): no audience sounds, no reverb wash, no random music cues.
\`\`\`

**Dialogue syntax that avoids subtitles:**

\`\`\`text
She looks into the lens and says: "This saves me an hour every day." Tone: assured, conversational.
\`\`\`

> The **colon** before quoted dialogue prevents subtitle overlays.

---

## Quality Control with Negative Prompts

Keep this block handy and tailor it per project:

\`\`\`text
Technical (Negative): subtitles, captions, watermark, text overlays, poor lighting, low resolution, artifacts, unwanted objects, inconsistent character appearance, audio sync issues, cartoon effects, distorted hands, oversaturation, compression noise, shaky cam.
\`\`\`

---

## Before vs After: A Quick Example

**Before (inconsistent):**

\`\`\`text
Woman unboxes a product, shows it to camera, talks about features. Office background.
\`\`\`

**After (consistent & cinematic):**

\`\`\`text
Subject: 28-year-old South Asian woman, shoulder-length wavy black hair, warm brown eyes ... confident posture ... minimal gold studs.

Action: She unboxes the product, lifts toward camera, rotates 30°, taps the primary feature, slight nod on emphasis.

Scene: Modern workstation, diffused daylight from left, matte desk, plant, mug.

Style: Medium close-up, camera at eye level (thats where the camera is), slow 8% dolly-in, 16:9, 24fps, neutral grade.

Dialogue: She looks into the lens and says: "In eight seconds, I'll show you why this matters." Tone: calm, friendly.

Sounds: quiet office ambiance, no music.

Technical (Negative): no subtitles, no watermarks, no text overlays, no shaky cam.
\`\`\`

---

## Implementation Checklist

- [ ] Paste a **fixed character block** in every prompt.  
- [ ] Add **explicit camera position** + motion.  
- [ ] Define **environmental audio** + forbid noise.  
- [ ] Include a strong **negative prompt**.  
- [ ] Keep total duration **≤ 8 seconds** for clarity.

---

## Related Reading

- [Meta Prompts for Veo 3: The Future of AI Video Creation](/insights/meta-prompts-for-veo-3-the-future-of-ai-video-creation)  
- [The Complete Meta Prompt Architecture for Professional Veo 3 Videos](/insights/veo-3-meta-prompt-architecture)

`,
          featured_image: "/blog/veo3-character-consistency-hero.webp",
    category: "tips",
    tags: ["veo3", "character consistency", "cinematography", "audio", "negative prompts"],
    published_at: "2025-08-12T00:52:02.384Z",
    updated_at: "2025-08-12T00:52:02.384Z",
    read_time: 3,
    is_featured: false
  },
  {
    id: "1754959685410",
    title: "Meta Prompts for Veo 3: The Future of AI Video Creation",
    slug: "meta-prompts-for-veo-3-the-future-of-ai-video-creation",
    excerpt: "Tired of writing complex prompts by hand? Learn how meta prompts automate professional Veo 3 video prompts using a seven-part structure, quality controls, and brand-safe best practices.",
    content: `# Meta Prompts for Veo 3: The Future of AI Video Creation

If you've ever wrestled with Veo 3 and thought, _"there must be a faster, more reliable way,"_ you're right. **Meta prompts** are AI systems that transform a plain-English brief into a **complete, production-ready Veo 3 prompt**—with cinematography, dialogue, audio, and negative prompts baked in.

> **TL;DR:** Meta prompts automate expert prompting. You describe the outcome, and the system generates a **professional, consistent, brand-safe** Veo 3 prompt—fast.

---

## What Are Meta Prompts?

A **meta prompt** is a higher-level instruction set that **creates** your Veo 3 prompt for you. Instead of writing every detail by hand, you provide intent (goal, setting, platform), and the meta layer outputs a **fully structured prompt** using tested patterns.

**What you get by default:**

- A professional **7‑component** Veo 3 prompt (subject, action, scene, style, dialogue, sounds, technical/negative).
- **Character descriptions** with 15+ attributes for visual consistency.
- **Brand-compliant visuals** aligned to color, tone, and style guides.
- **Platform-optimized** formatting for Shorts/Reels/TikTok/YouTube.
- **Audio–visual sync** guidance that avoids subtitle artifacts.
- **Quality controls** via comprehensive negative prompts.

---

## Meta Prompting vs. Traditional Prompting

| Traditional Prompting | Meta Prompting |
|----------------------|----------------|
| Manual, time-heavy | Automated, repeatable |
| Inconsistent outputs | Professional consistency |
| Narrow personal knowledge | Embedded best practices |
| Trial-and-error | Proven patterns |
| Hard to scale | Easy to A/B test and templatize |

**Bottom line:** Meta prompts make expert quality **repeatable**.

---

## The Professional 7‑Component Veo 3 Format

Every output from a good meta prompt includes these components:

1. **Subject** – Character/object with **15+ physical & stylistic attributes**.  
2. **Action** – Movement, timing, micro-expressions, transitions.  
3. **Scene** – Location, props, environment, lighting, time-of-day.  
4. **Style** – Shot type, lens, angle, motion, aspect ratio, grade.  
5. **Dialogue** – Tone, pacing, accent, delivery; **colon syntax** to avoid subtitles.  
6. **Sounds** – Ambient, foley, music, environmental audio.  
7. **Technical (Negative)** – Everything to exclude for quality control.

**Copy-paste example:**

\`\`\`text
Subject: 28-year-old South Asian woman, shoulder-length wavy black hair, warm brown eyes, soft jawline, light natural makeup, smart-casual slate blazer over white tee, minimal gold studs, confident posture, relaxed hand gestures, friendly smile baseline, calm voice with light Cambridge accent.

Action: She unboxes a product, lifts it toward camera, rotates it 30°, taps the primary feature, and nods subtly at key beats.

Scene: Modern workstation, diffused daylight from left, soft shadows, matte desk, minimal props (laptop closed, plant, mug), no clutter.

Style: Medium close-up, camera at eye level (thats where the camera is), slow 8% dolly-in, 16:9, 24fps, neutral color grade with gentle contrast.

Dialogue: She looks into the lens and says: "In eight seconds, I'll show you why this saves me an hour every day." Tone: assured, conversational.

Sounds: Quiet office ambiance, faint keyboard clicks off-screen, no music.

Technical (Negative): no subtitles, no captions, no watermarks, no text overlays, no audience sounds, no shaky cam, no low-res, no oversaturation.
\`\`\`

---

## Why This Works in Veo 3

- **Explicit camera position** (\`(thats where the camera is)\`) improves shot fidelity.  
- **Colon before dialogue** prevents unwanted subtitles.  
- **Detailed subject + negatives** reduce drift, artifacts, and hand issues.  
- **Audio environment** avoids hallucinated background sounds.

---

## Use Cases That Convert

- **Product demos** that look on-brand across a full campaign.
- **UGC-style ads** with consistent faces and wardrobe.
- **Educational clips** that stay clear and structured.
- **Cinematic reveals** with controlled camera physics.

> Tip: Pair meta prompts with a **prompt library** and internal links to your product pages to capture intent while readers are primed to act.

---

## Quick Start Checklist

- Define the **goal** (hook, feature, CTA).  
- Lock **character** with 15+ attributes.  
- Specify **shot, angle, movement, and camera position**.  
- Include **environmental audio** and **strong negatives**.  
- Keep the total clip **≤ 8 seconds** for best results.

---

## Related Reading

- [Mastering Character Consistency & Cinematic Quality in Veo 3](/insights/mastering-character-consistency-and-cinematic-quality-in-veo-3)  
- [The Complete Meta Prompt Architecture for Professional Veo 3 Videos](/insights/veo-3-meta-prompt-architecture)

`,
          featured_image: "/blog/veo3-meta-prompts-hero.webp",
    category: "tutorials",
    tags: ["veo3", "meta prompts", "prompt engineering", "ai video", "workflow"],
    published_at: "2025-08-12T00:48:05.410Z",
    updated_at: "2025-08-12T00:48:05.410Z",
    read_time: 4,
    is_featured: true
  }
] 