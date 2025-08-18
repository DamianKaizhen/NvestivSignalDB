# Page snapshot

```yaml
- dialog "Unhandled Runtime Error":
  - navigation:
    - button "previous" [disabled]:
      - img "previous"
    - button "next" [disabled]:
      - img "next"
    - text: 1 of 1 error
  - button "Close"
  - heading "Unhandled Runtime Error" [level=1]
  - paragraph: "TypeError: web_vitals__WEBPACK_IMPORTED_MODULE_0__.getCLS is not a function"
  - heading "Source" [level=2]
  - link "lib/performance.ts (69:10) @ sendToAnalytics":
    - text: lib/performance.ts (69:10) @ sendToAnalytics
    - img
  - text: 67 | 68 | // Measure Core Web Vitals > 69 | getCLS(sendToAnalytics) | ^ 70 | getFID(sendToAnalytics) 71 | getFCP(sendToAnalytics) 72 | getLCP(sendToAnalytics)
  - heading "Call Stack" [level=2]
  - button "Show collapsed frames"
```