# NotebookLM money-shot critique

Source: Google NotebookLM notebook `SCHNGN money-shot UI critique` (`2e7e904c-5762-4045-9b4c-36e93fdd1653`).

### Above-the-Fold Optimization

To fit the constrained real estate of a mobile browser (PWA) and prevent a vertically bloated "scroll-fest," you must tightly consolidate your components. Having a Hero card, status sentences, a timeline, and a day usage bar all competing for the initial view will cause immediate cognitive overload.

**What must be visible above the fold:**
1.  **State & Privacy Anchors**: A clean header showing a "Local & Private" offline-ready icon (critical for establishing trust immediately) [1, 2] and a prominent segment-toggle between **Check Mode** (historical logging) and **Planning Mode** (future simulations) [3].
2.  **The Unified "Anxiety-Relief" Card**: Do not separate the status, the metric, and the exit date into individual UI elements. Merge them into a single, high-contrast container that dynamically changes color (Green for "Safe," Amber for "Action Required").
3.  **The Timeline Visualizer (Top Segment)**: The 180-day sliding window timeline must be partially visible right beneath the card, serving as a visual bridge that invites the user to scroll down for details.

**What to push below the fold:**
*   The raw trip list, the detailed plain-language explanation drawer [2, 4], and secondary action triggers like the "Border-ready PDF" CTA [2, 5] should live lower down.

---

### The Rolling 180-Day Timeline Visualizer

A circular gauge or a simple "90-day progress bar" fails because the Schengen limit is not a static bucket; it is a sliding window [2, 4]. Showing a gauge that says "45 days remaining" can easily mislead a traveler into planning a continuous 45-day trip that actually violates a rolling limit three weeks in.

```
       [   PREVIOUS 180-DAY WINDOW   ] [ TODAY ] [   FUTURE 180-DAY WINDOW   ]
<-------|=============================|----[*]----|=============================|------>
        [█████████]             [░░░░]             [▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒]
        Past Trips            Locked Trip          Draft Simulation
```

*   **The "Time-Slit" Slider**: Implement a horizontal timeline where the user can scrub left or right [2, 6]. The rolling 180-day window should be represented as a highlighted sliding aperture [2, 4].
*   **Dual-State Visualization**: Inside this sliding aperture, display a continuous horizontal bar with color-coded travel blocks:
    *   **Solid Teal**: Past/committed trips [7].
    *   **Dashed Teal**: Active draft simulations [7].
    *   **Striped Amber/Red**: Overstay segments that violate the 90-day limit [8].
*   **Dynamic Scrubbing**: As the user drags the timeline slider, the "days used" and "cushion days" counters must update dynamically in the hero card based on where the 180-day frame is placed [2, 4]. This physically demonstrates how past days "fall out" of the rolling window [2, 4].

---

### Building Trust & Reducing Anxiety

Competitor research reveals that even mathematically correct apps suffer from low reviews because users simply do not understand or trust rolling-window calculations [4, 6].

*   **Conversational Translation ("Show Your Work")**: Replace standard technical calculations with a plain-language explanation drawer [2]. Instead of just showing the formula, present an interactive QA translation:
    > **"Why am I safe?"**
    > *"Looking back from the end of your proposed Italy trip on Oct 13, your 180-day window starts on Apr 16. During this period, you only spent 15 days in France, leaving you with a generous 15-day safe buffer [2, 4]."*
*   **Future Trip Protection (The Lockdown Shield)**: When a user simulations a trip in **Planning Mode**, the app must warn them if it will invalidate a *future*, locked trip (e.g., a critical summer holiday already booked in Greece) [2, 9, 10]. Your engine must actively calculate forwards and backwards to protect these committed dates [9, 11].
*   **Public Parity Badge**: Display a prominent, clickable validation label: *"Verified against the official European Commission Short-Stay Calculator"* [2, 12]. Link this directly to a dedicated page containing your public test-suite results (covering inclusive dates, timezone/DST boundaries, and complex edge cases) to reinforce your calculation's integrity [2, 13, 14].

---

### Confusing Copy & Labels to Avoid

*   ❌ **"Cushion Days"**: This is highly ambiguous. Users often confuse "cushion" with "consecutive days I can spend right now." Instead, label this **"Safe Buffer Today"** or **"Unused Days inside this window."**
*   ❌ **"Latest Safe Exit"**: If a user has multiple future entries and exits planned, a single "latest safe exit" is mathematically misleading. Instead, use a contextual label like **"Must exit Schengen by [Date] on this trip"** or **"Maximum stay for this entry."**
*   ❌ **"Draft" vs. "Locked"**: These are developer-centric terms. Non-technical travelers will find them confusing. Instead, use:
    *   **"Committed"** (for flights/hotels already booked) [9].
    *   **"Simulated / What-If"** (for planned or hypothetical trips) [7].
*   ❌ **"Entry/Exit Dates"**: Users frequently fail to count both boundaries as full days (e.g., entering Oct 1 and leaving Oct 3 is calculated as 3 days, not 2) [3, 14]. Ensure your form inputs explicitly label these: **"First Day in Schengen (Counts as Day 1)"** and **"Last Day in Schengen (Counts as full day)"**.

---

### High-Risk Usability Testing Script

When testing your first interactive PWA prototype with your core audience (such as digital nomads or second-home owners) [15], measure success against these five high-risk friction points:

1.  **The Simulation Buffer Confusion**: Ask the user to add a 30-day "simulation" trip. Check if they understand that this "simulation" is purely a draft and has not permanently altered or deleted their official, locked travel history [7].
2.  **The Rolling Window "Aha!" Moment**: Observe if users naturally scrub or interact with the horizontal timeline slider to inspect past trips. Do they successfully grasp *why* their available days increase as they slide past a historical trip block [2, 4]?
3.  **Boundary Math Error**: Have the user input a single-day trip (entry and exit on the same day). Do they understand and trust why the app registers this as **1 day used** rather than 0 [3, 14]?
4.  **Simulation Conflict Resolution**: Intentionally trigger an overstay warning by simulating a trip that overlaps or violates a future committed trip [8, 9]. Does the user understand that the simulation is the problem, or do they experience anxiety that their actual locked trip has been broken [2, 10]?
5.  **Local Storage Security Fear**: Because the PWA is privacy-first and does not require an account sign-up, users may fear their data will vanish if they close their browser [2, 5]. Test if the "Offline & Private" status indicator and the visibility of the "Export JSON/CSV" and "Generate PDF" utilities successfully mitigate this concern [2, 5, 16].

📋 Would you like me to write the core TypeScript logic for checking overlapping trips and calculating the active 180-day window boundaries?
