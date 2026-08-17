# Review + History Simplification Design

Date: 2026-08-17
Project: `mrprohack/chess_rev`
Target branch/PR: `feat/motion-review-profile` / PR #1

## Goal

Make the chess review experience simpler and closer to the supplied Game Review references:

1. Keep the chessboard as the primary visual focus.
2. Add a clear **Hide Review / Show Review** control for the right-side Game Review panel.
3. Move game browsing out of the review panel into a dedicated **History** page.
4. Show the latest **20** Chess.com games for the saved Chess.com profile.
5. Keep Chess.com profile setup in **Settings → Account**.
6. Preserve the existing analysis API, board animation, bookmarks, engine settings, and profile-based board orientation.

## Information Architecture

The app remains a lightweight single-page React application with no routing dependency. `App.jsx` owns a top-level view state:

- `review`
- `history`

The sidebar contains four primary actions:

- **Review** — switch to the chess review workspace.
- **History** — show the latest 20 Chess.com games.
- **Play** — open Chess.com Play in a new tab.
- **Settings** — open the existing Settings modal.

No React Router dependency is added.

## Review Page

### Layout

The review page keeps the current board + right-panel layout.

The board is the dominant element. The right panel is a focused **Game Review** panel inspired by the supplied reference screenshots, without copying Chess.com branding or proprietary artwork.

### Review Panel Header

The panel header contains:

- title: **Game Review**
- compact subtitle only when useful: **Review a game or paste a game link**
- analysis status (`Ready`, `Analyzing`)
- **Hide Review** action

When hidden:

- the right panel is removed from layout
- the board expands into the available horizontal space
- a small **Show Review** control remains near the board edge or workspace toolbar
- hiding the panel does not reset move index, autoplay state, analysis data, bookmarks, or board orientation

The show/hide state is UI-only and does not need backend persistence. The default on a fresh session is **shown**.

### Source Controls

The large profile loader stays out of the Review page.

The Review page supports:

- paste Chess.com or Lichess game URL
- Analyze button
- recent-game selection only through the History page

If a game was selected from History, the Review page opens that game and begins analysis using the same existing `POST /api/analyze` flow.

### Review Content

The existing analysis/replay features remain:

- board arrows
- important move classifications
- played-vs-best story
- move list
- evaluation display/graph where available
- playback controls
- bookmarks
- keyboard navigation
- flip board
- engine settings shortcut

Do not add fake engine explanations. If the backend does not provide natural-language explanations, use the existing deterministic move-story text.

## History Page

### Purpose

History is a dedicated browsing surface for the saved Chess.com profile. It replaces the recent-games list previously shown in the Review panel.

### Data

Use the already-loaded Chess.com profile response in app state when possible.

The History page shows at most the latest **20 standard chess games** from the Chess.com profile endpoint. The profile endpoint is requested with `limit=20` for History. Existing backend limit validation remains bounded and safe.

Do not load all historical archives. No infinite scroll and no pagination in this version.

### History Row

Use a simple list/table-like row, not a card grid.

Each row shows:

- result: `W`, `L`, or `D`
- opponent username
- opponent rating when available
- user color: White or Black
- time class: Rapid / Blitz / Bullet / Daily when returned
- played date

### History Actions

Clicking a game row:

1. switches `App.jsx` view state to `review`
2. sets the selected game URL
3. analyzes it using the existing analysis request
4. preserves saved-profile perspective so the board automatically orients to the user's side

History has one primary utility action: **Refresh**, which re-fetches the saved Chess.com profile with `limit=20`.

No filtering, sorting menus, search, pagination, or archive picker in this version.

### History States

If no saved Chess.com profile exists:

> Connect Chess.com in Settings to see your games.

Provide one button: **Open Settings**.

If profile loading fails, show the safe backend error message and keep a Retry/Refresh action.

If the profile has no standard games:

> No recent standard games found.

## Settings → Account

Keep Chess.com account/profile management in Settings. The Account section owns the Chess.com username input, Load/Refresh profile action, saved default username behavior, avatar/name/profile link, rating summary, and Play Chess shortcut.

The Account section must not duplicate the 20-game history list.

## State Ownership

`frontend/src/App.jsx` continues to own shared state, including `activeView`, `isReviewPanelVisible`, `currentGameUrl`, `gameData`, `profileData`, `profileLoading`, `profileError`, `defaultChessUsername`, and existing review/playback/bookmark/settings state.

Do not introduce a global state library.

## Component Boundaries

- `Sidebar.jsx`: Review/History navigation plus Play/Settings.
- `RightPanel.jsx`: review-only; no profile loader or recent-game browser; owns the hide control.
- `GameHistory.jsx`: latest-20 list; fetching is delegated to `App.jsx`; emits selected game URL.
- `SettingsModal.jsx`: keeps Chess.com profile/account setup.
- `App.jsx`: owns active view, history refresh, history → review selection, and review-panel visibility.

## Backend

Prefer no new backend endpoint. Reuse `GET /api/chesscom/profile/{username}?limit=20`.

Do not add credentials, login, cookies, or private Chess.com APIs.

## Responsive Behavior

### Desktop

- Board + review panel side-by-side when panel is shown.
- Board expands when review panel is hidden.
- History uses a full-width list within the main content area.

### Mobile / Narrow Width

- Board remains first.
- Review panel stacks below the board when shown.
- Hide/Show Review remains reachable without scrolling to the end of the page.
- History rows collapse into two readable lines without horizontal scrolling.
- Settings remains the existing bottom-sheet/modal pattern.

## Accessibility

- Review show/hide control is a real button with expanded state.
- Sidebar navigation exposes the active item.
- History rows are keyboard-accessible buttons.
- Result does not rely on color alone; W/L/D text is shown.
- Reduced-motion behavior is preserved.

## Error Handling

- History profile errors use the existing safe profile API messages.
- Analysis failures remain in the Review page and do not erase History state.
- Invalid/missing History URLs are ignored rather than navigating to a broken review state.
- Refreshing History does not clear the currently reviewed game.

## Testing

Verify pure history helpers, user color detection, W/L/D outcome display, newest-first/20-game cap, existing replay tests, oxlint, Vite build, backend syntax, `test_main.py`, and `test_chesscom_profile.py`.

Manual UI verification covers Review shown, Review hidden/expanded, History populated, History no-profile state, History row → Review, Settings → Account, mobile Review, and mobile History.

## Non-Goals

This version does not include all-time history, pagination, infinite scroll, filters/search, opening statistics, opponent analytics, cloud account sync, Chess.com authentication, or an exact clone of Chess.com's proprietary UI/artwork.

## Success Criteria

The change is complete when the Review panel can be hidden/shown without losing state; the board gains space when hidden; History is a separate app view capped at the latest 20 standard Chess.com games; clicking a history game opens and analyzes it in Review; profile setup remains in Settings → Account; Review no longer contains profile/history clutter; desktop/mobile layouts are readable; and CI passes.
