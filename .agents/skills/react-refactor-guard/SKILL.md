---
name: react-refactor-guard
description: Non-negotiable React best-practice rules for this monorepo. Load this skill before writing, editing, or reviewing ANY React code in apps/react-v19 or apps/react-v16. These rules are derived from real bugs hit in the angular-demos sibling project and from the fundamental differences between React 16 (class) and React 19 (hooks). They must be applied every time without exception.
---

# React Refactor Guard — Always-On Rules

This monorepo runs two React apps side by side to demonstrate the evolution of React patterns. They are intentionally different — do not cross-contaminate patterns between them.

| App | Version | Component model | Renderer | Port |
|-----|---------|-----------------|----------|------|
| `apps/react-v19` | React 19.2.5, Vite 8.0.10 | Function components + hooks | `createRoot` | 5173 |
| `apps/react-v16` | React 16.14.0, Vite 8.0.10 | Class components + lifecycle | `ReactDOM.render` | 5174 |
| `apps/shell` | dev only | iframe host | — | 3000 |

**Rule zero:** Before writing or editing any file, identify which app it belongs to by reading `apps/react-v19/package.json` or `apps/react-v16/package.json` and confirming the React version. The folder path is unambiguous — use it.

---

## Rules for apps/react-v19 (React 19 — hooks / functional)

### 1. No class components. Ever.
`apps/react-v19` is a functional-component-only codebase. If you see `class X extends Component` or `class X extends PureComponent`, that is a v16 pattern carried over accidentally — it is a bug. Do not add class components, lifecycle methods, or `this.state`. Every component is a plain function.

### 2. useEffect dependency array must be exhaustive
Every value from component scope that is read inside a `useEffect` body must appear in the dependency array, OR it must come from a ref (which is stable). Missing dependencies cause stale closures — the effect silently runs with outdated values, producing bugs that only appear after specific state transitions.

```tsx
// ❌ stale closure — count is captured at mount, never updated
useEffect(() => {
  const id = setInterval(() => {
    setCount(count + 1); // count is always 0
  }, 1000);
  return () => clearInterval(id);
}, []); // missing: count

// ✅ functional update — no stale closure, count removed from deps
useEffect(() => {
  const id = setInterval(() => {
    setCount(prev => prev + 1);
  }, 1000);
  return () => clearInterval(id);
}, []);
```

### 3. Never use useEffect for data transformation
If you find a `useEffect` that maps, filters, or derives a value from props/state and then calls `setState`, that is a bug pattern. Data transformation belongs in render or in `useMemo`. The effect form causes an extra render cycle (render with stale value → effect runs → setState → render again) and is always wrong.

```tsx
// ❌ extra render, stale-value window
useEffect(() => {
  setFilteredItems(items.filter(i => i.active));
}, [items]);

// ✅ computed during render — single pass, always fresh
const filteredItems = useMemo(() => items.filter(i => i.active), [items]);
```

### 4. Never derive state into useState
`useState` initialised from a prop or computed value is only evaluated once — at mount. It immediately goes stale when the source changes.

```tsx
// ❌ doubled is stale after count changes
const [doubled, setDoubled] = useState(count * 2);

// ✅ derived inline — always in sync
const doubled = count * 2;

// ✅ expensive derivation — memoised
const sorted = useMemo(() => [...items].sort(compareFn), [items]);
```

### 5. setState in useEffect that reads the same state → functional update
Calling `setState(stateVar + 1)` inside a `useEffect([stateVar])` is an infinite loop. The state change triggers the effect, the effect changes state, repeat. Use the functional update form and remove the state from the dep array.

```tsx
// ❌ infinite loop
useEffect(() => {
  setCount(count + 1);
}, [count]);

// ✅ functional update — count not needed in deps
useEffect(() => {
  setCount(prev => prev + 1);
}, [someTrigger]);
```

### 6. Object / array literals in JSX props break React.memo
A new object or array literal created inline in JSX gets a new reference every render, defeating `React.memo`'s shallow comparison. Memoize with `useMemo` or move the value outside the component.

```tsx
// ❌ new object every render → Child always re-renders
<Child style={{ color: 'red' }} options={[1, 2, 3]} />

// ✅
const style = useMemo(() => ({ color: 'red' }), []);
const options = useMemo(() => [1, 2, 3], []);
<Child style={style} options={options} />
```

### 7. Anonymous functions in JSX props break React.memo
An inline arrow function creates a new reference every render. Wrap in `useCallback` whenever passing callbacks to memoised children.

```tsx
// ❌ new function reference every render
<Button onClick={() => handleDelete(item.id)} />

// ✅
const handleDeleteItem = useCallback(() => handleDelete(item.id), [item.id, handleDelete]);
<Button onClick={handleDeleteItem} />
```

### 8. useContext without value memoisation causes cascading re-renders
If the context value is `{ user, setUser }`, that object literal is re-created every time the Provider's parent renders, re-rendering every consumer. Always stabilise the context value.

```tsx
// ❌ new object reference every render → every consumer re-renders
<AuthContext.Provider value={{ user, setUser }}>

// ✅
const value = useMemo(() => ({ user, setUser }), [user, setUser]);
<AuthContext.Provider value={value}>
```

### 9. useEffect adding window.addEventListener MUST return a cleanup function
Missing cleanup causes the listener to accumulate across remounts (especially in React StrictMode, which mounts twice in development). Memory leak and double-handling guaranteed.

```tsx
// ❌ no cleanup → listeners stack up
useEffect(() => {
  window.addEventListener('message', handleMessage);
}, []);

// ✅
useEffect(() => {
  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}, [handleMessage]); // handleMessage must be stable (useCallback)
```

### 10. External event handler in useEffect must use a stable reference
The handler passed to `addEventListener` and the handler passed to `removeEventListener` must be the same reference. Wrap the handler in `useCallback` with the correct deps, then use that stable reference in the effect.

```tsx
// ❌ different reference on every render → removeEventListener is a no-op
useEffect(() => {
  const handler = (e) => { ... };
  window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler); // different fn
}, [someDep]);

// ✅ stable reference
const handler = useCallback((e: MessageEvent) => {
  // ...
}, [someDep]);

useEffect(() => {
  window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler);
}, [handler]);
```

### 11. postMessage handlers MUST have type + source guards — no exceptions
Browser extensions (including development tools) flood all window contexts with postMessage heartbeats at ~250ms intervals. Without a type and source guard, every handler fires on every heartbeat, causing constant re-renders or state mutations.

The Claude in Chrome extension (`ienfalfjdbdpebioblfackkekamfmbnh`) is confirmed to do this. Treat all unknown postMessage senders as noise.

```tsx
// ❌ fires on every extension heartbeat
const handler = useCallback((e: MessageEvent) => {
  setState(e.data.value); // runs ~4x per second from extension heartbeats
}, []);

// ✅ type + source guard — only processes intended messages
const handler = useCallback((e: MessageEvent) => {
  const d = e.data as Record<string, unknown> | null | undefined;
  if (d?.['type'] !== 'LIFECYCLE_EVENT' || d?.['source'] !== 'v16') return;
  // safe to process
}, []);
```

### 12. Tab switch that drives an iframe MUST reset mirrored state
When a tab switch causes an iframe to navigate to a different route, the iframe reloads and its internal state resets to zero. The host component does not reset automatically — this creates a desync where the host shows stale values (e.g. "mounted: true") while the iframe is actually freshly unmounted.

Always reset all state that mirrors the iframe's state when navigating away from the tab that controls it.

```tsx
// ❌ stale host state after iframe reloads
const setTab = (id: string) => {
  setActiveTab(id); // iframe navigates → reloads → state is now wrong
};

// ✅ reset mirrored state before tab switch
const setTab = (id: string) => {
  if (activeTab === 'lifecycle' && id !== 'lifecycle') {
    setIframeMounted(false);
    setIframeCount(0);
    setIframeLog([]);
  }
  setActiveTab(id);
};
```

### 13. React StrictMode runs effects twice in development — design for it
In React 18+ and React 19, StrictMode intentionally mounts → unmounts → remounts every component in development. Effects run twice. If your effect is not idempotent (subscriptions, counters, one-time initialisation), it will behave incorrectly in dev. Always return proper cleanup and verify the effect can run twice without side effects.

### 14. useRef for values that do not drive the UI
If a value is used in event handlers, timers, or side effects but never read in JSX, use `useRef`, not `useState`. `useState` schedules a re-render on every change — if the UI doesn't need to react to the change, that render is wasted.

```tsx
// ❌ re-renders the component on every timer tick for no visual reason
const [timerId, setTimerId] = useState<number | null>(null);

// ✅ stable, no re-render
const timerIdRef = useRef<number | null>(null);
```

### 15. useTransition for non-urgent state updates
Tab switches, search filter changes, navigation, sort order changes — these are "can wait" updates. Wrap them in `startTransition` to keep input and animation frames responsive while React processes the update.

```tsx
const [isPending, startTransition] = useTransition();
const switchTab = (id: string) => {
  startTransition(() => setActiveTab(id));
};
```

### 16. useDeferredValue for expensive child renders
If a child component has expensive rendering driven by a frequently-changing value (e.g. search input → large list), use `useDeferredValue` to debounce the expensive render without blocking the input.

```tsx
const deferredQuery = useDeferredValue(query);
// pass deferredQuery to the expensive list component
```

### 17. React 19 use() hook for async data
If you are using a `useEffect` + `useState(null)` pattern solely to load async data, consider `use(promise)` with a `<Suspense>` boundary. It eliminates the loading state boilerplate and integrates with concurrent features.

### 18. React 19: ref is a plain prop — no forwardRef needed
React 19 supports `ref` as a regular prop on function components. Using `forwardRef` is not wrong but is redundant in this app. New components should accept `ref` directly.

### 19. useOptimistic for instant UI feedback on mutations
For actions that update server state, use `useOptimistic` to show the expected result before the server responds. Do not fake it with a temporary `useState` that you clear after the request completes.

### 20. Never call hooks conditionally or inside loops
Hooks must be called in the same order on every render. No `if (condition) { useEffect(...) }`. No `for (const x of list) { useState(x) }`. Extract conditional logic inside the hook body, not around the hook call.

### 21. Impure renders are bugs
A function called in JSX that returns a different value each call (`Math.random()`, `Date.now()`, `performance.now()`) produces different output on every render pass. In StrictMode this surfaces as visible flickering or mismatched snapshots. Move such values into a `useRef` (initialised once) or derive them from stable state.

---

## Rules for apps/react-v16 (React 16 — class components)

### 1. No function components with hooks in this app
`apps/react-v16` must remain a class-component codebase to faithfully demonstrate the React 16 model. Do not introduce `useState`, `useEffect`, or any other hook. If you need to add a component, make it a class.

### 2. Never use deprecated (UNSAFE_) lifecycle methods
`componentWillMount`, `componentWillReceiveProps`, and `componentWillUpdate` are removed in React 18 and flagged with `UNSAFE_` prefix in React 16. They fire at incorrect times relative to async rendering. Use safe alternatives:

| Deprecated | Safe alternative |
|-----------|-----------------|
| `componentWillMount` | `componentDidMount` for async data, constructor for sync init |
| `componentWillReceiveProps` | `getDerivedStateFromProps` (static) or `componentDidUpdate` |
| `componentWillUpdate` | `getSnapshotBeforeUpdate` for pre-update DOM reads |

### 3. setState is async — never read this.state immediately after calling it
`this.setState({ count: this.state.count + 1 })` followed immediately by `console.log(this.state.count)` logs the OLD value. When new state depends on old state, always use the callback form:

```js
// ❌ stale read
this.setState({ count: this.state.count + 1 });
console.log(this.state.count); // old value

// ✅ callback form guarantees correct previous state
this.setState(prev => ({ count: prev.count + 1 }));
```

### 4. setState is NOT batched outside React event handlers in React 16
Inside a React synthetic event handler, multiple `setState` calls are batched into one render. Outside React's control (setTimeout, Promise.then, native addEventListener callbacks), each `setState` triggers its own full render cycle. Batch manually when needed:

```js
// ❌ two separate renders
setTimeout(() => {
  this.setState({ a: 1 });
  this.setState({ b: 2 });
}, 0);

// ✅ one render
import { unstable_batchedUpdates } from 'react-dom';
setTimeout(() => {
  unstable_batchedUpdates(() => {
    this.setState({ a: 1 });
    this.setState({ b: 2 });
  });
}, 0);
```

### 5. Never bind event handlers inside render
`onClick={() => this.handleClick(id)}` creates a new function reference every render, breaking `PureComponent`'s shallow comparison and `shouldComponentUpdate`. Bind in the constructor or use class property syntax:

```js
// ❌ new reference every render
<button onClick={() => this.handleDelete(item.id)}>

// ✅ class property — stable reference
handleDelete = (id) => { ... };
<button onClick={() => this.handleDelete(item.id)}>
// If id varies, bind in constructor: this.handleDelete = this.handleDelete.bind(this)
// Or use a data attribute and read from e.currentTarget.dataset
```

### 6. window.addEventListener in componentDidMount MUST have removeEventListener in componentWillUnmount
Missing cleanup causes the listener to survive component unmount, accumulating with every remount. The handler MUST be stored as a class property — you cannot remove an anonymous inline arrow function from a listener list.

```js
// ❌ no cleanup, anonymous — cannot be removed
componentDidMount() {
  window.addEventListener('message', (e) => this.handleMessage(e));
}

// ✅ stored as class property, removed in componentWillUnmount
handleMessage = (e) => {
  const d = e.data;
  if (!d || d.type !== 'LIFECYCLE_EVENT' || d.source !== 'v16') return;
  this.setState({ ... });
};

componentDidMount() {
  window.addEventListener('message', this.handleMessage);
}

componentWillUnmount() {
  window.removeEventListener('message', this.handleMessage);
}
```

### 7. postMessage handlers MUST have type + source guards — no exceptions
Same as React 19 Rule 11. Extension heartbeats (~250ms) hit every window including iframes. Without a type+source guard, `setState` fires ~4x per second from noise, causing a constant render storm.

### 8. setState in componentDidUpdate MUST be inside a condition
Unconditional `setState` in `componentDidUpdate` causes an infinite render loop: update → componentDidUpdate → setState → update → repeat. Always gate on a comparison:

```js
// ❌ infinite loop
componentDidUpdate() {
  this.setState({ computed: this.expensive() });
}

// ✅ gated on actual change
componentDidUpdate(prevProps, prevState) {
  if (prevProps.input !== this.props.input) {
    this.setState({ computed: this.expensive(this.props.input) });
  }
}
```

### 9. Use PureComponent for components that only re-render on prop/state changes
`Component` re-renders on every parent render regardless of whether props changed. `PureComponent` does shallow comparison of props and state — use it for leaf components and presentational components. Be aware: it only does shallow comparison, so nested object mutations won't trigger re-render.

### 10. Never use index as key for dynamic or reorderable lists
Using the array index as key causes React to match wrong DOM nodes when items are added, removed, or reordered. Always use a stable unique identifier.

```jsx
// ❌ index as key — breaks on reorder/insert/delete
{items.map((item, i) => <Row key={i} data={item} />)}

// ✅ stable ID as key
{items.map(item => <Row key={item.id} data={item} />)}
```

### 11. getDerivedStateFromProps is almost always the wrong choice
It runs on every render (not just when props change), tightly couples state to props, and is a common source of bugs. Prefer lifting state, using the `key` prop to reset a child, or computing values in render. If you must use it, always `return null` as the default case to avoid unintended state overwrites.

### 12. componentDidMount is the only correct place for async data fetching
Fetching in `constructor` or `UNSAFE_componentWillMount` fires before the component is in the tree — errors and `setState` calls behave unexpectedly and may memory-leak after unmount. Always fetch in `componentDidMount` and cancel or guard in `componentWillUnmount`.

### 13. Tab switch that drives an iframe MUST reset mirrored state
Same as React 19 Rule 12. The v16 iframe reloads when the shell navigates away. Class component state equivalent:

```js
setTab(id) {
  if (this.state.activeTab === 'lifecycle' && id !== 'lifecycle') {
    this.setState({ iframeMounted: false, iframeCount: 0, iframeLog: [] });
  }
  this.setState({ activeTab: id });
}
```

### 14. Never mutate this.state directly
`this.state.items.push(x)` mutates state in place — React has no way to detect the change and will not re-render. Always produce a new array or object:

```js
// ❌ direct mutation — no re-render
this.state.items.push(newItem);

// ✅ new reference — React detects the change
this.setState(prev => ({ items: [...prev.items, newItem] }));
```

---

## Cross-cutting rules (both apps)

- **Read the file before writing.** Never assume the current state matches what was discussed earlier in the session. Always read the actual file first.
- **One change per edit.** Fix the identified issue only. Do not refactor unrelated logic, rename variables, or reformat code outside the scope of the fix.
- **Version-correct patterns only.** `apps/react-v19` = hooks rules. `apps/react-v16` = class component rules. The folder path is unambiguous — use it to determine which rule set applies before writing a single line.
- **Document the why.** When applying a fix, add a one-line comment explaining the reason (e.g. `// postMessage guard — extension heartbeats fire every ~250ms and must be filtered`).
- **Never use index as key with dynamic lists.** Applies to both versions.
- **Never mutate state directly.** Both versions: `this.state.arr.push(x)` (v16) and mutating a state variable inline (v19) are bugs. Always produce new objects/arrays.
- **No expensive inline calculations in render.** Anything that takes non-trivial time (`sort`, `filter` on large arrays, heavy math) called directly in JSX or `render()` runs on every render pass. Memoize with `useMemo` (v19) or cache in instance state/updated only in lifecycle methods (v16).
- **No impure render functions.** `Math.random()`, `Date.now()`, `performance.now()` called inline in JSX or `render()` produce different output every pass. Move to refs or stable state.
- **postMessage guard is non-negotiable in both apps.** Every `window.addEventListener('message', ...)` handler in this repo must start with a type+source guard before touching component state. No exceptions.
- **Iframe-driven tab state must be reset on tab switch in both apps.** Any component that mirrors state from a cross-frame postMessage bridge must clear that state when navigating away from the tab that owns the bridge.
