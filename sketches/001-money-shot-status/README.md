## Variant: Money Shot Status

### Design stance
A mobile-first confidence dashboard: answer the travel-safety question immediately, then expose the rolling-window math on demand.

### Key choices
- Layout: one phone-sized screen with hero status, rolling 180-day visualizer, trip list, and explanation drawer.
- Typography: tight system-font hierarchy, large status number, compact operational labels.
- Color: calm navy/white base with lime-green safe state and red risk state.
- Interaction: simulate +9 days toggles from safe to risk; explanation drawer opens/closes; PDF button shows a toast.

### What this tests
- Whether a plain-language status beats raw counters.
- Whether the horizontal “active 180-day window” visual makes the rule legible.
- Whether protected/locked future trips are understandable.
- Whether users can see what broke when a simulation causes overstay.

### Trade-offs
- Strong at: immediate decision clarity and trust explanation.
- Weak at: the timeline is still abstract; may need more direct date labels or a scrubber.

### Best for
Frequent travelers and UK/US/Canada users who plan multiple trips and need confidence before booking.
